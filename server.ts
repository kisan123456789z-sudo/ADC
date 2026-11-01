import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/authRoutes.js';
import { verifyToken } from './server/authService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Parse port from CLI args (--port <PORT>) or fallback to 3000
function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = Number(process.argv[portArgIdx + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = Number(process.env.PORT);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}
const PORT = resolvePort();

// Enable trust proxy for reverse proxies (Cloud Run / AI Studio environment)
app.set('trust proxy', 1);

// Enable CORS for static frontend hosts (e.g. GitHub Pages)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parser for JSON
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount Secure Authentication Router
app.use('/api/auth', authRoutes);

/**
 * ============================================================================
 * WHATSAPP CLOUD API BACKEND ROUTES
 * ============================================================================
 */

// 1. GET /api/whatsapp/config - Returns configuration status without leaking secret tokens
app.get('/api/whatsapp/config', (req, res) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  const missingKeys: string[] = [];
  if (!accessToken) missingKeys.push('WHATSAPP_ACCESS_TOKEN');
  if (!phoneNumberId) missingKeys.push('WHATSAPP_PHONE_NUMBER_ID');

  const isConfigured = Boolean(accessToken && phoneNumberId);

  res.json({
    isConfigured,
    phoneNumberId: phoneNumberId ? `...${phoneNumberId.slice(-4)}` : undefined,
    businessAccountId: businessAccountId ? `...${businessAccountId.slice(-4)}` : undefined,
    hasAccessToken: Boolean(accessToken),
    webhookVerified: Boolean(webhookVerifyToken),
    missingKeys
  });
});

// 2. POST /api/whatsapp/broadcast - Server-side broadcast dispatch via Meta Cloud API (Protected: Staff/Admin Only)
app.post('/api/whatsapp/broadcast', async (req, res) => {
  // Authorization check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required to trigger broadcast.' });
  }
  const token = authHeader.split(' ')[1];
  const session = verifyToken(token);
  if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
    return res.status(403).json({ error: 'Forbidden: Only staff and admin can trigger broadcast notifications.' });
  }
  const { campaignId, recipients, message } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required.' });
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return res.status(503).json({
      error: 'WhatsApp Business Cloud API is not configured on this server.',
      missingKeys: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']
    });
  }

  let submittedCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;
  const results: any[] = [];

  for (const recipient of recipients) {
    try {
      const cleanPhone = (recipient.phone || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        failedCount++;
        results.push({ phone: recipient.phone, status: 'failed', error: 'Invalid phone number format' });
        continue;
      }

      // Format payload according to Meta WhatsApp Cloud API specifications
      let payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone
      };

      if (message.type === 'image' && message.mediaUrl) {
        payload.type = 'image';
        payload.image = {
          link: message.mediaUrl,
          caption: message.content || message.mediaCaption || ''
        };
      } else if (message.type === 'video' && message.mediaUrl) {
        payload.type = 'video';
        payload.video = {
          link: message.mediaUrl,
          caption: message.content || message.mediaCaption || ''
        };
      } else {
        payload.type = 'text';
        payload.text = {
          preview_url: Boolean(message.ctaUrl),
          body: message.content
        };
      }

      const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const metaData = await metaResponse.json();

      if (metaResponse.ok && metaData.messages?.[0]?.id) {
        submittedCount++;
        results.push({
          phone: recipient.phone,
          status: 'submitted',
          whatsappMessageId: metaData.messages[0].id
        });
      } else {
        failedCount++;
        results.push({
          phone: recipient.phone,
          status: 'failed',
          error: metaData.error?.message || 'Meta Cloud API rejected the message'
        });
      }
    } catch (err: any) {
      failedCount++;
      results.push({
        phone: recipient.phone,
        status: 'failed',
        error: err.message || 'Network exception while dispatching to Meta API'
      });
    }
  }

  return res.json({
    success: true,
    campaignId,
    total: recipients.length,
    submittedCount,
    deliveredCount,
    failedCount,
    results
  });
});

// 3. GET /api/whatsapp/webhook - Webhook Verification Challenge from Meta
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'anujay_clinic_webhook_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('WhatsApp Webhook successfully verified by Meta!');
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Webhook verification token mismatch.' });
});

// 4. POST /api/whatsapp/webhook - Receiving delivery & read statuses from Meta
app.post('/api/whatsapp/webhook', (req, res) => {
  const body = req.body;
  if (body.object === 'whatsapp_business_account') {
    // Process status updates (sent, delivered, read, failed)
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const st of statuses) {
          console.log(`WhatsApp Status update for message ${st.id}: ${st.status}`);
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.sendStatus(404);
});

/**
 * ============================================================================
 * VITE MIDDLEWARE / STATIC ASSETS
 * ============================================================================
 */
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Anujay Clinic server running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
