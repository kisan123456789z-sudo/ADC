import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clear preloader timeout once script executes
if (typeof window !== 'undefined' && (window as any).__preloaderTimer) {
  clearTimeout((window as any).__preloaderTimer);
}

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Fatal initialization error rendering AnuJay Dental Clinic:', error);
    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;text-align:center;">
        <div style="max-width:380px;background:#ffffff;padding:28px 24px;border-radius:20px;box-shadow:0 12px 30px rgba(0,32,91,0.12);border:1px solid #e2e8f0;">
          <div style="width:48px;height:48px;background:#fee2e2;color:#dc2626;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;font-weight:bold;">!</div>
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#00205b;">AnuJay Dental Clinic</h2>
          <p style="font-size:13px;color:#64748b;margin:0 0 20px;line-height:1.5;">The clinic portal needs to refresh to load the latest update.</p>
          <button onclick="window.location.reload(true)" style="background:#00205b;color:#ffffff;border:none;padding:12px 20px;font-weight:700;font-size:13px;border-radius:12px;cursor:pointer;width:100%;box-shadow:0 4px 12px rgba(0,32,91,0.2);">
            Reload Portal
          </button>
        </div>
      </div>
    `;
  }
}
