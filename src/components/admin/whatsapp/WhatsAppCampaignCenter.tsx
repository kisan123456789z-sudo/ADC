import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Tag, 
  Bell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  UserCheck, 
  UserX, 
  PhoneCall, 
  ExternalLink, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Upload, 
  Eye, 
  X, 
  Bookmark, 
  Globe, 
  Radio, 
  Check, 
  AlertTriangle,
  Play,
  ArrowRight
} from 'lucide-react';
import { useClinic } from '../../../context/ClinicContext';
import { 
  WhatsAppCampaign, 
  CampaignRecipient, 
  CampaignType, 
  CampaignCategory, 
  AudienceType, 
  Patient, 
  CampaignStats,
  WhatsAppConfigStatus
} from '../../../types/clinic';
import { 
  normalizeE164, 
  calculateAudience, 
  BUILTIN_CAMPAIGN_TEMPLATES, 
  getCampaignsList, 
  getCampaignRecipients, 
  saveCampaignRecord, 
  deleteCampaignRecord, 
  executeCampaignBroadcast, 
  retryFailedCampaignRecipients, 
  getWhatsAppApiConfig,
  generateWhatsAppDeepLink
} from '../../../services/whatsappService';
import { WhatsAppLivePreview } from './WhatsAppLivePreview';
import { compressDataUrl } from '../../../utils/fileStorageHelper';

export const WhatsAppCampaignCenter: React.FC = () => {
  const { patients, settings, updatePatient } = useClinic();

  // Active Center Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'composer' | 'templates' | 'history' | 'consent' | 'meta_config'
  >('dashboard');

  // Real-time Campaigns list from Firestore
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  // Meta Cloud API Configuration status
  const [apiConfig, setApiConfig] = useState<WhatsAppConfigStatus>({
    isConfigured: false,
    hasAccessToken: false,
    webhookVerified: false,
    missingKeys: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']
  });

  // Composer Form State
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('text');
  const [campaignCategory, setCampaignCategory] = useState<CampaignCategory>('promotional');
  const [campaignContent, setCampaignContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaSource, setMediaSource] = useState<'url' | 'upload'>('url');
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState('');

  // Offer Details State
  const [discountText, setDiscountText] = useState('25% OFF Teeth Whitening & Cleaning');
  const [couponCode, setCouponCode] = useState('SMILE25');
  const [offerStartDate, setOfferStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [offerExpiryDate, setOfferExpiryDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [offerTerms, setOfferTerms] = useState('Valid for one patient per visit. Prior booking required.');

  // Call-To-Action State
  const [ctaText, setCtaText] = useState('Book Appointment Online');
  const [ctaUrl, setCtaUrl] = useState('https://maps.app.goo.gl/z2c6moS2vPQ87f1V8');

  // Audience & Scheduling
  const [audienceType, setAudienceType] = useState<AudienceType>('all_eligible');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [scheduledTimezone, setScheduledTimezone] = useState('Asia/Kolkata (IST)');

  // Broadcast Confirmation Dialog State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{
    processed: number;
    total: number;
    stats: CampaignStats;
  } | null>(null);

  // History & Detailed Recipients View State
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('All');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [expandedRecipients, setExpandedRecipients] = useState<CampaignRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [retryingCampaignId, setRetryingCampaignId] = useState<string | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Campaigns & API Config on mount
  useEffect(() => {
    refreshCampaigns();
    getWhatsAppApiConfig().then(setApiConfig).catch(() => {});
  }, []);

  const refreshCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const list = await getCampaignsList();
      setCampaigns(list);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Calculate live audience metrics
  const audienceMetrics = useMemo(() => {
    return calculateAudience(patients, audienceType);
  }, [patients, audienceType]);

  // Aggregate Dashboard Statistics
  const dashboardStats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const sentCampaigns = campaigns.filter(c => c.status === 'delivered' || c.status === 'submitted' || c.status === 'partially_failed').length;
    const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
    const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;

    let totalSubmitted = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalFailed = 0;

    campaigns.forEach(c => {
      if (c.stats) {
        totalSubmitted += c.stats.submitted || 0;
        totalDelivered += c.stats.delivered || 0;
        totalRead += c.stats.read || 0;
        totalFailed += c.stats.failed || 0;
      }
    });

    const totalEligiblePatients = patients.filter(p => !p.whatsappOptOut).length;
    const totalConsented = patients.filter(p => p.whatsappConsent !== false && !p.whatsappOptOut).length;

    return {
      totalCampaigns,
      sentCampaigns,
      scheduledCampaigns,
      draftCampaigns,
      totalSubmitted,
      totalDelivered,
      totalRead,
      totalFailed,
      totalEligiblePatients,
      totalConsented
    };
  }, [campaigns, patients]);

  // Quick helper to insert markdown or emojis into content textarea
  const insertTextAtCursor = (textToInsert: string) => {
    setCampaignContent(prev => prev + textToInsert);
  };

  // Media File Upload Handler with Validation
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaError('');
    setIsUploadingMedia(true);
    setMediaUploadProgress(10);

    // Validate type and size
    if (campaignType === 'video') {
      const validVideoTypes = ['video/mp4', 'video/3gpp', 'video/quicktime'];
      if (!validVideoTypes.includes(file.type)) {
        setMediaError('Unsupported video format. WhatsApp Cloud API supports MP4 and 3GPP videos.');
        setIsUploadingMedia(false);
        return;
      }
      // 16 MB WhatsApp limit
      if (file.size > 16 * 1024 * 1024) {
        setMediaError(`Video size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds WhatsApp maximum limit of 16 MB.`);
        setIsUploadingMedia(false);
        return;
      }
    } else {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        setMediaError('Unsupported image format. WhatsApp supports JPG, PNG, and WebP.');
        setIsUploadingMedia(false);
        return;
      }
      // 5 MB WhatsApp image limit
      if (file.size > 5 * 1024 * 1024) {
        setMediaError(`Image size exceeds WhatsApp maximum limit of 5 MB.`);
        setIsUploadingMedia(false);
        return;
      }
    }

    try {
      setMediaUploadProgress(40);
      const reader = new FileReader();
      reader.onload = async () => {
        let dataUrl = reader.result as string;
        setMediaUploadProgress(70);

        // Compress image if it's an image
        if (campaignType !== 'video' && dataUrl.startsWith('data:image/')) {
          try {
            dataUrl = await compressDataUrl(dataUrl, {
              maxWidth: 1200,
              maxHeight: 1200,
              quality: 0.82,
              maxSizeBytes: 400 * 1024
            });
          } catch {}
        }

        setMediaUrl(dataUrl);
        setMediaUploadProgress(100);
        setIsUploadingMedia(false);
        showToast("✓ Media file uploaded and verified for WhatsApp!");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMediaError('Failed to read and process media file.');
      setIsUploadingMedia(false);
    }
  };

  // Load a template into the composer
  const loadTemplateIntoComposer = (tmpl: Partial<WhatsAppCampaign>) => {
    setCampaignId(undefined); // Fresh campaign instance
    setCampaignTitle(tmpl.title || 'Special Clinic Announcement');
    setCampaignType(tmpl.type || 'text');
    setCampaignCategory(tmpl.category || 'promotional');
    setCampaignContent(tmpl.content || '');
    setMediaUrl(tmpl.mediaUrl || '');
    setMediaCaption(tmpl.mediaCaption || '');
    setMediaSource('url');
    if (tmpl.offerDetails) {
      setDiscountText(tmpl.offerDetails.discountText || '');
      setCouponCode(tmpl.offerDetails.couponCode || '');
      setOfferStartDate(tmpl.offerDetails.startDate || new Date().toISOString().slice(0, 10));
      setOfferExpiryDate(tmpl.offerDetails.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
      setOfferTerms(tmpl.offerDetails.terms || '');
    }
    setCtaText(tmpl.ctaText || 'Book Appointment Online');
    setCtaUrl(tmpl.ctaUrl || 'https://maps.app.goo.gl/z2c6moS2vPQ87f1V8');
    setAudienceType(tmpl.audienceType || 'all_eligible');
    setActiveSubTab('composer');
    showToast(`✓ Loaded template: "${tmpl.title}" into Campaign Composer`);
  };

  // Save Campaign as Draft or Template
  const handleSaveDraft = async (isTemplate = false) => {
    if (!campaignTitle.trim()) {
      showToast("Please enter a campaign title before saving.");
      return;
    }

    try {
      const campaignToSave: WhatsAppCampaign = {
        ...(campaignId ? { id: campaignId } : {}),
        title: campaignTitle.trim(),
        type: campaignType,
        category: campaignCategory,
        content: campaignContent.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType: campaignType === 'video' ? 'video' : 'image',
        mediaCaption: mediaCaption.trim() || undefined,
        offerDetails: campaignType === 'offer' ? {
          discountText,
          couponCode,
          startDate: offerStartDate,
          expiryDate: offerExpiryDate,
          terms: offerTerms
        } : undefined,
        ctaText: ctaText.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        audienceType,
        status: isScheduled ? 'scheduled' : 'draft',
        scheduledAt: isScheduled ? `${scheduledDate}T${scheduledTime}:00` : undefined,
        scheduledTimezone: isScheduled ? scheduledTimezone : undefined,
        createdAt: new Date().toISOString(),
        createdBy: 'Clinic Administrator',
        stats: {
          totalRecipients: audienceMetrics.eligible.length,
          submitted: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          optedOutExcluded: audienceMetrics.optedOut.length,
          invalidExcluded: audienceMetrics.invalid.length
        },
        isTemplate
      };

      const res = await saveCampaignRecord(campaignToSave);
      setCampaignId(res.id);
      await refreshCampaigns();
      showToast(isTemplate ? "✓ Saved as reusable WhatsApp template!" : "✓ Campaign saved as Draft!");
    } catch (err: any) {
      console.error("Save draft error:", err);
      showToast("Failed to save campaign draft: " + (err.message || 'Error'));
    }
  };

  // One-Click Broadcast Trigger: Opens Confirmation Dialog
  const handleInitiateBroadcast = () => {
    if (!campaignTitle.trim()) {
      showToast("Please provide a Campaign Title.");
      return;
    }
    if (!campaignContent.trim()) {
      showToast("Please write message content in the composer.");
      return;
    }
    if ((campaignType === 'image' || campaignType === 'video') && !mediaUrl.trim()) {
      showToast(`Please upload or attach a valid ${campaignType} file/URL.`);
      return;
    }
    if (audienceMetrics.eligible.length === 0) {
      showToast("No eligible patients found for the selected audience segment.");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Confirmed Broadcast Execution
  const handleExecuteConfirmedBroadcast = async () => {
    setIsConfirmModalOpen(false);
    setIsBroadcasting(true);
    setBroadcastProgress({
      processed: 0,
      total: audienceMetrics.eligible.length,
      stats: {
        totalRecipients: audienceMetrics.eligible.length,
        submitted: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        optedOutExcluded: audienceMetrics.optedOut.length,
        invalidExcluded: audienceMetrics.invalid.length
      }
    });

    try {
      // 1. Ensure campaign record exists in Firestore
      const campaignRecord: WhatsAppCampaign = {
        ...(campaignId ? { id: campaignId } : {}),
        title: campaignTitle.trim(),
        type: campaignType,
        category: campaignCategory,
        content: campaignContent.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType: campaignType === 'video' ? 'video' : 'image',
        mediaCaption: mediaCaption.trim() || undefined,
        offerDetails: campaignType === 'offer' ? {
          discountText,
          couponCode,
          startDate: offerStartDate,
          expiryDate: offerExpiryDate,
          terms: offerTerms
        } : undefined,
        ctaText: ctaText.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        audienceType,
        status: 'queued',
        createdAt: new Date().toISOString(),
        createdBy: 'Clinic Administrator',
        stats: {
          totalRecipients: audienceMetrics.eligible.length,
          submitted: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          optedOutExcluded: audienceMetrics.optedOut.length,
          invalidExcluded: audienceMetrics.invalid.length
        }
      };

      const saved = await saveCampaignRecord(campaignRecord);
      campaignRecord.id = saved.id;
      setCampaignId(saved.id);

      // 2. Execute broadcast engine
      const res = await executeCampaignBroadcast(
        campaignRecord,
        patients,
        (processed, total, stats) => {
          setBroadcastProgress({ processed, total, stats });
        }
      );

      await refreshCampaigns();
      setIsBroadcasting(false);

      if (res.success) {
        showToast(`🎉 Broadcast completed! ${res.stats.submitted} patient messages submitted.`);
        setActiveSubTab('history');
      } else {
        showToast(`⚠️ Broadcast partially failed. ${res.stats.failed} messages failed.`);
      }
    } catch (err: any) {
      console.error("Broadcast failed:", err);
      setIsBroadcasting(false);
      showToast(err.message || "Failed to execute WhatsApp broadcast.");
    }
  };

  // Expand campaign details to view individual recipient logs
  const handleToggleExpandCampaign = async (cid: string) => {
    if (expandedCampaignId === cid) {
      setExpandedCampaignId(null);
      setExpandedRecipients([]);
      return;
    }

    setExpandedCampaignId(cid);
    setIsLoadingRecipients(true);
    try {
      const recs = await getCampaignRecipients(cid);
      setExpandedRecipients(recs);
    } catch (err) {
      console.error("Failed to load recipients:", err);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Retry Failed Recipients
  const handleRetryFailed = async (camp: WhatsAppCampaign) => {
    if (!camp.id) return;
    setRetryingCampaignId(camp.id);
    try {
      const res = await retryFailedCampaignRecipients(camp);
      showToast(`✓ Retried ${res.retriedCount} failed recipient(s).`);
      await refreshCampaigns();
      if (expandedCampaignId === camp.id) {
        const updated = await getCampaignRecipients(camp.id);
        setExpandedRecipients(updated);
      }
    } catch (err) {
      showToast("Failed to retry campaign recipients.");
    } finally {
      setRetryingCampaignId(null);
    }
  };

  // Duplicate a past campaign
  const handleDuplicateCampaign = (camp: WhatsAppCampaign) => {
    loadTemplateIntoComposer({
      ...camp,
      title: `Copy of ${camp.title}`
    });
  };

  // Toggle patient consent
  const handleTogglePatientConsent = async (p: Patient) => {
    if (!p.id) return;
    const isCurrentlyOptedOut = p.whatsappOptOut === true;
    try {
      await updatePatient(p.id, {
        whatsappOptOut: !isCurrentlyOptedOut,
        whatsappConsent: isCurrentlyOptedOut, // If un-opting-out, mark consented
        whatsappConsentDate: new Date().toISOString(),
        whatsappConsentSource: 'manual'
      });
      showToast(`Updated WhatsApp notification status for ${p.name}`);
    } catch (err) {
      showToast("Failed to update patient consent status.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Center Top Brand Banner */}
      <div className="bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#00205b] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-emerald-900/60 text-emerald-200 border border-emerald-400/40 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enterprise Broadcast Hub</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                apiConfig.isConfigured 
                  ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50' 
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}>
                {apiConfig.isConfigured ? '● Meta Cloud API Connected' : '○ Standby Mode (Cloud API Unset)'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              WhatsApp Campaign &amp; Broadcast Center
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Create, preview, schedule, and broadcast personalized dental treatment offers, festival greetings, and clinic announcements to all registered patients.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setCampaignId(undefined);
                setCampaignTitle('');
                setCampaignContent('');
                setMediaUrl('');
                setActiveSubTab('composer');
              }}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#075e54] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-[#075e54]" />
              <span>+ Create Campaign</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('templates')}
              className="px-4 py-2.5 bg-emerald-900/50 hover:bg-emerald-900/80 border border-emerald-400/40 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-emerald-300" />
              <span>Templates ({BUILTIN_CAMPAIGN_TEMPLATES.length})</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-900 text-white text-xs font-semibold rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Campaign Center Navigation Tabs */}
      <div className="flex overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold gap-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'dashboard'
              ? 'bg-[#075e54] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Dashboard &amp; Stats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('composer')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'composer'
              ? 'bg-[#075e54] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Campaign Composer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'templates'
              ? 'bg-[#075e54] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Clinic Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'history'
              ? 'bg-[#075e54] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Broadcast History ({campaigns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('consent')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'consent'
              ? 'bg-[#075e54] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Patient Consent ({patients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('meta_config')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'meta_config'
              ? 'bg-[#075e54] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Meta Cloud API Setup</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: CAMPAIGN DASHBOARD & REAL STATS                      */}
      {/* ============================================================== */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Campaigns
              </span>
              <div className="text-2xl font-black text-slate-900">
                {dashboardStats.totalCampaigns}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {dashboardStats.sentCampaigns} sent • {dashboardStats.draftCampaigns} drafts
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Eligible Patients
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {dashboardStats.totalEligiblePatients}
              </div>
              <span className="text-[10px] text-slate-400 block">
                of {patients.length} registered clinic records
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Messages Submitted
              </span>
              <div className="text-2xl font-black text-[#075e54]">
                {dashboardStats.totalSubmitted}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {dashboardStats.totalDelivered} confirmed delivered
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Failed / Excluded
              </span>
              <div className="text-2xl font-black text-rose-600">
                {dashboardStats.totalFailed}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Invalid numbers or policy blocks
              </span>
            </div>
          </div>

          {/* Quick Launcher Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-emerald-950 text-base">
                Ready to launch a new broadcast to all clinic patients?
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-xl">
                Choose from pre-made clinical offers (Dental checkups, Scaling, Festival greetings) or compose a custom announcement with image/video and live WhatsApp preview.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  loadTemplateIntoComposer(BUILTIN_CAMPAIGN_TEMPLATES[0]);
                }}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Launch Festive Offer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('composer')}
                className="px-4 py-2.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Blank Composer →</span>
              </button>
            </div>
          </div>

          {/* Recent Broadcasts Snapshot */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent WhatsApp Broadcasts</h3>
                <p className="text-xs text-slate-500">Live overview of campaign deliveries and recipient feedback</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full History ({campaigns.length})</span>
                <span>→</span>
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                <p className="font-semibold text-slate-700 text-sm">No campaigns recorded yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Click '+ Create Campaign' to broadcast your first patient announcement.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {campaigns.slice(0, 4).map(camp => (
                  <div key={camp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{camp.title}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] uppercase">
                          {camp.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          camp.status === 'delivered' || camp.status === 'submitted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : camp.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : camp.status === 'partially_failed'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                          {camp.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-500 line-clamp-1 text-[11px]">{camp.content}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="font-bold text-slate-800 block text-xs">
                          {camp.stats?.submitted || 0} / {camp.stats?.totalRecipients || 0} Sent
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString() : 'Draft'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleExpandCampaign(camp.id!)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer text-xs"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: CAMPAIGN COMPOSER & LIVE WHATSAPP PREVIEW           */}
      {/* ============================================================== */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Form: Composer Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Campaign Composer</h3>
                <p className="text-xs text-slate-500">Craft rich WhatsApp broadcasts with real-time phone preview</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSaveDraft(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDraft(true)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </div>

            {/* 1. Message Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                1. Select Message Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'text', label: 'Text Message', icon: FileText },
                  { id: 'image', label: 'Photo / Image', icon: ImageIcon },
                  { id: 'video', label: 'Video Message', icon: Video },
                  { id: 'offer', label: 'Special Offer', icon: Tag },
                  { id: 'notice', label: 'Clinic Notice', icon: Bell }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = campaignType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCampaignType(item.id as CampaignType);
                        if (item.id === 'offer') setCampaignCategory('promotional');
                        if (item.id === 'notice') setCampaignCategory('announcement');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#075e54] text-white border-[#075e54] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`} />
                      <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Campaign Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Title / Internal Ref <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Diwali Cleaning Promo 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075e54]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Category
                </label>
                <select
                  value={campaignCategory}
                  onChange={(e) => setCampaignCategory(e.target.value as CampaignCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075e54] cursor-pointer"
                >
                  <option value="promotional">Promotional Offer</option>
                  <option value="announcement">Important Announcement</option>
                  <option value="festival_greeting">Festival Greeting</option>
                  <option value="timing_update">Clinic Timing Update</option>
                  <option value="health_awareness">Oral Health Tip</option>
                  <option value="service_update">New Dental Service</option>
                  <option value="appointment_reminder">Appointment Followup</option>
                </select>
              </div>
            </div>

            {/* 3. Media Uploader / URL (For Image, Video, Offer, Notice) */}
            {(campaignType === 'image' || campaignType === 'video' || campaignType === 'offer' || campaignType === 'notice') && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {campaignType === 'video' ? <Video className="w-4 h-4 text-emerald-700" /> : <ImageIcon className="w-4 h-4 text-emerald-700" />}
                    <span>{campaignType === 'video' ? 'Video Media Attachment' : 'Banner Image Attachment'}</span>
                  </span>

                  <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaSource('url')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${mediaSource === 'url' ? 'bg-[#075e54] text-white' : 'text-slate-600'}`}
                    >
                      Paste URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaSource('upload')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${mediaSource === 'upload' ? 'bg-[#075e54] text-white' : 'text-slate-600'}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {mediaSource === 'url' ? (
                  <div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={campaignType === 'video' ? "https://example.com/clinic-video.mp4" : "https://images.unsplash.com/photo-..."}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075e54]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Must be a publicly accessible direct image (JPG/PNG) or MP4 video URL.
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept={campaignType === 'video' ? "video/mp4,video/3gpp" : "image/jpeg,image/png,image/webp"}
                      onChange={handleMediaFileUpload}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#075e54] file:text-white hover:file:bg-[#128c7e] cursor-pointer"
                    />
                    {isUploadingMedia && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Processing media for WhatsApp...</span>
                          <span>{mediaUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#075e54] h-full transition-all duration-200" style={{ width: `${mediaUploadProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mediaError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{mediaError}</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Special Offer Parameters */}
            {campaignType === 'offer' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  <span>Offer &amp; Privilege Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Discount Headline</label>
                    <input
                      type="text"
                      value={discountText}
                      onChange={(e) => setDiscountText(e.target.value)}
                      placeholder="e.g. 25% OFF Teeth Whitening"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Coupon Code (Optional)</label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. SMILE25"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Offer Valid Until</label>
                    <input
                      type="date"
                      value={offerExpiryDate}
                      onChange={(e) => setOfferExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Terms Summary</label>
                    <input
                      type="text"
                      value={offerTerms}
                      onChange={(e) => setOfferTerms(e.target.value)}
                      placeholder="e.g. Prior appointment required."
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Message Content & WhatsApp Formatting Helpers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Message Body Content <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span className="text-slate-400 text-[10px]">Shortcuts:</span>
                  <button type="button" onClick={() => insertTextAtCursor('*bold*')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-bold">*B*</button>
                  <button type="button" onClick={() => insertTextAtCursor('_italic_')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded italic">_I_</button>
                  <button type="button" onClick={() => insertTextAtCursor('~strike~')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded line-through">~S~</button>
                  <button type="button" onClick={() => insertTextAtCursor('```monospace```')} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[10px]">`code`</button>
                </div>
              </div>

              {/* Emoji quick insertion bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm no-scrollbar">
                {['✨', '🦷', '🌟', '🎁', '📅', '📢', '🚨', '💡', '🌿', '📍', '⏰', '🎉'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertTextAtCursor(` ${emoji} `)}
                    className="p-1 hover:bg-slate-100 rounded cursor-pointer transition"
                    title={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={7}
                value={campaignContent}
                onChange={(e) => setCampaignContent(e.target.value)}
                placeholder="Type your WhatsApp campaign message here. Supports WhatsApp formatting: *bold*, _italic_, ~strikethrough~, and emojis..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075e54] leading-relaxed resize-y"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>WhatsApp formatting supported. Preview updates live on right.</span>
                <span>{campaignContent.length} characters</span>
              </div>
            </div>

            {/* 6. Call To Action Button (WhatsApp Interactive Template Pill) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">CTA Button Label</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Book Appointment"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Action URL or Tel</label>
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="e.g. https://clinic.com or tel:+91..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* 7. Target Audience & Eligibility Filter */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Target Audience Segment</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {audienceMetrics.eligible.length} Eligible Patients
                </span>
              </div>

              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value as AudienceType)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075e54] cursor-pointer"
              >
                <option value="all_eligible">All Eligible Registered Patients (One-Click Broadcast)</option>
                <option value="consented_only">Patients With Express WhatsApp Consent Only</option>
                <option value="recent_patients">Active Patients (Visited Clinic in Last 6 Months)</option>
                <option value="male_only">Male Patients Segment</option>
                <option value="female_only">Female Patients Segment</option>
              </select>

              {/* Real Audience Breakdown Badges */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1 text-[11px]">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-slate-500 block text-[10px]">Will Receive:</span>
                  <strong className="text-emerald-800 text-sm font-black">{audienceMetrics.eligible.length}</strong>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Opted-Out Excluded:</span>
                  <strong className="text-slate-700 text-sm font-black">{audienceMetrics.optedOut.length}</strong>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-slate-500 block text-[10px]">Invalid Phone:</span>
                  <strong className="text-rose-700 text-sm font-black">{audienceMetrics.invalid.length}</strong>
                </div>
              </div>
            </div>

            {/* 8. Delivery Timing: Immediate vs Scheduled */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Broadcast Schedule</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 text-[#075e54] rounded focus:ring-0 cursor-pointer"
                  />
                  <span>Schedule for Future Date</span>
                </label>
              </div>

              {isScheduled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Time Zone</label>
                    <input
                      type="text"
                      disabled
                      value={scheduledTimezone}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleInitiateBroadcast}
                className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-[#075e54] to-[#128c7e] hover:from-[#064e46] hover:to-[#0f7a6e] text-white font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isScheduled ? `Schedule Broadcast (${audienceMetrics.eligible.length} Patients)` : `Broadcast to All Patients (${audienceMetrics.eligible.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveDraft(false)}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Save Draft
              </button>
            </div>

          </div>

          {/* Right Column: Live WhatsApp Interactive Phone Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Live WhatsApp Preview
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Exact Client Simulation
                </span>
              </div>

              {/* Phone Mockup Screen */}
              <WhatsAppLivePreview
                title={campaignTitle}
                type={campaignType}
                content={campaignContent}
                mediaUrl={mediaUrl}
                mediaType={campaignType === 'video' ? 'video' : 'image'}
                mediaCaption={mediaCaption}
                ctaText={ctaText}
                ctaUrl={ctaUrl}
                offerDetails={campaignType === 'offer' ? {
                  discountText,
                  couponCode,
                  expiryDate: offerExpiryDate
                } : undefined}
                clinicName={settings.clinicName || "Dr. Anujay's Dental Clinic"}
              />
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: CLINIC TEMPLATES & REUSABLE DRAFTS                   */}
      {/* ============================================================== */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base">Clinically Curated WhatsApp Templates</h3>
            <p className="text-xs text-slate-500">
              One-click reusable templates tailored for dental clinics. Pre-crafted with proper WhatsApp formatting, emojis, and call-to-actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUILTIN_CAMPAIGN_TEMPLATES.map((tmpl, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                <div>
                  {tmpl.mediaUrl && (
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      <img src={tmpl.mediaUrl} alt={tmpl.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {tmpl.type}
                      </span>
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      {tmpl.category.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{tmpl.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {tmpl.content}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Ready to Use</span>
                  <button
                    type="button"
                    onClick={() => loadTemplateIntoComposer(tmpl)}
                    className="px-4 py-2 bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: CAMPAIGN HISTORY & REAL DELIVERY REPORTS            */}
      {/* ============================================================== */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Broadcast History &amp; Delivery Reports</h3>
              <p className="text-xs text-slate-500">Track delivery rates, inspect recipient-level logs, and retry failed transmissions</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshCampaigns}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Table of Campaigns */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4">Failed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-600" />
                      <p className="font-semibold text-slate-600">No campaigns launched yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Use the Campaign Composer to start your first WhatsApp broadcast.</p>
                    </td>
                  </tr>
                ) : (
                  campaigns.map(camp => {
                    const isExpanded = expandedCampaignId === camp.id;
                    return (
                      <React.Fragment key={camp.id}>
                        <tr className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{camp.title}</div>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              {camp.sentAt ? new Date(camp.sentAt).toLocaleString() : 'Not sent'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 uppercase font-mono text-[10px] text-slate-600">
                            {camp.type}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {camp.stats?.totalRecipients || 0} patients
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#075e54]">
                            {camp.stats?.submitted || 0}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {camp.stats?.delivered || 0}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                            {camp.stats?.failed || 0}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              camp.status === 'delivered' || camp.status === 'submitted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : camp.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : camp.status === 'partially_failed'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-slate-100 text-slate-700'
                            }`}>
                              {camp.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleExpandCampaign(camp.id!)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition cursor-pointer"
                            >
                              {isExpanded ? 'Hide' : 'Recipients'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateCampaign(camp)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#075e54] font-bold rounded-lg text-[11px] transition cursor-pointer"
                              title="Duplicate Campaign"
                            >
                              <Copy className="w-3 h-3 inline" />
                            </button>
                            {camp.stats?.failed > 0 && (
                              <button
                                type="button"
                                disabled={retryingCampaignId === camp.id}
                                onClick={() => handleRetryFailed(camp)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px] transition cursor-pointer"
                                title="Retry Failed"
                              >
                                {retryingCampaignId === camp.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <RotateCcw className="w-3 h-3 inline" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (camp.id) {
                                  await deleteCampaignRecord(camp.id);
                                  await refreshCampaigns();
                                  showToast("Campaign deleted.");
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Recipient Detail View */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-4 bg-slate-50/80 border-y border-slate-200">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Individual Recipient Transmission Log ({expandedRecipients.length})</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Click 'Direct WhatsApp' to test individual client link
                                  </span>
                                </div>

                                {isLoadingRecipients ? (
                                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Loading recipient logs...</span>
                                  </div>
                                ) : expandedRecipients.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No recipient details found for this campaign.</p>
                                ) : (
                                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                                    <table className="w-full text-left text-[11px]">
                                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                                        <tr>
                                          <th className="py-2 px-3">Patient</th>
                                          <th className="py-2 px-3">WhatsApp Number</th>
                                          <th className="py-2 px-3">Status</th>
                                          <th className="py-2 px-3">WhatsApp Msg ID</th>
                                          <th className="py-2 px-3 text-right">Direct Action</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {expandedRecipients.map((rec, rIdx) => (
                                          <tr key={rec.id || rIdx} className="hover:bg-slate-50">
                                            <td className="py-2 px-3 font-semibold text-slate-900">
                                              {rec.patientName}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-slate-600">
                                              {rec.phoneNumber}
                                            </td>
                                            <td className="py-2 px-3">
                                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                rec.status === 'delivered' || rec.status === 'submitted'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : rec.status === 'failed'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : 'bg-slate-100 text-slate-700'
                                              }`}>
                                                {rec.status.toUpperCase()}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">
                                              {rec.whatsappMessageId || 'Pending Cloud API'}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              <a
                                                href={generateWhatsAppDeepLink(rec.phoneNumber, camp.content)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#075e54] font-bold rounded-lg text-[10px] transition"
                                              >
                                                <ExternalLink className="w-2.5 h-2.5" />
                                                <span>wa.me Link</span>
                                              </a>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 5: PATIENT CONSENT & AUDIENCE MANAGEMENT               */}
      {/* ============================================================== */}
      {activeSubTab === 'consent' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Patient WhatsApp Consent &amp; Opt-Out Registry</h3>
              <p className="text-xs text-slate-500">
                Manage compliance with WhatsApp messaging policies. Patients can also self-manage opt-out in their Patient Portal.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700">
              Total Patients: <span className="font-mono">{patients.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Registered Phone</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Visits</th>
                  <th className="py-3 px-4">WhatsApp Consent Status</th>
                  <th className="py-3 px-4 text-right">Compliance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map(p => {
                  const isOptedOut = p.whatsappOptOut === true;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {normalizeE164(p.phone)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {p.totalVisits || 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOptedOut 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOptedOut ? 'Opted-Out of Marketing' : 'Consented & Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleTogglePatientConsent(p)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isOptedOut
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isOptedOut ? 'Re-Enable Consent' : 'Opt-Out Patient'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 6: META CLOUD API CONFIGURATION & WEBHOOK INSTRUCTIONS */}
      {/* ============================================================== */}
      {activeSubTab === 'meta_config' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-lg">Official Meta WhatsApp Business Cloud API Integration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure enterprise messaging infrastructure via Meta Graph API v21.0
            </p>
          </div>

          {/* Current Connection Status Box */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            apiConfig.isConfigured 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${apiConfig.isConfigured ? 'text-emerald-700' : 'text-amber-700'}`} />
            <div className="space-y-1">
              <span className="font-bold text-xs uppercase tracking-wider block">
                {apiConfig.isConfigured ? '✓ Cloud API Active and Ready' : '⚠️ Cloud API Credentials Pending'}
              </span>
              <p className="text-xs leading-relaxed">
                {apiConfig.isConfigured 
                  ? `Your Meta WhatsApp Cloud API is configured. Broadcasts will transmit directly through Phone Number ID ${apiConfig.phoneNumberId}.`
                  : 'WhatsApp Business Cloud API credentials have not yet been placed in your server environment variables. In this mode, the campaign engine safely validates numbers, records recipient logs in Firestore, and generates one-click wa.me links.'}
              </p>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">How to Connect Official WhatsApp Cloud API:</h4>
            
            <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed">
              <li>Log in to the <strong>Meta for Developers Portal</strong> (<code>developers.facebook.com</code>).</li>
              <li>Under your Meta App, enable the <strong>WhatsApp Product</strong>.</li>
              <li>Obtain your <strong>Phone Number ID</strong> and <strong>WhatsApp Business Account ID</strong>.</li>
              <li>Generate a System User <strong>Permanent Access Token</strong> with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.</li>
              <li>Add these environment variables to your server configuration:</li>
            </ol>

            <div className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] space-y-1">
              <div>WHATSAPP_ACCESS_TOKEN="EAA..."</div>
              <div>WHATSAPP_PHONE_NUMBER_ID="1000..."</div>
              <div>WHATSAPP_BUSINESS_ACCOUNT_ID="2000..."</div>
              <div>WHATSAPP_WEBHOOK_VERIFY_TOKEN="anujay_clinic_webhook_2026"</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
              <span className="font-bold text-slate-900 block">Webhook Callback URL for Real-Time Delivery Updates:</span>
              <code className="text-[#075e54] font-mono text-xs">{typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}</code>
              <p className="text-[10px] text-slate-400 mt-0.5">Subscribe to <code>messages</code> in Meta Webhook settings to track live read and delivery checkmarks.</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CONFIRM ONE-CLICK BROADCAST DIALOG                    */}
      {/* ============================================================== */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 space-y-5">
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#075e54] flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Confirm WhatsApp Broadcast
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to broadcast this campaign to all eligible patients?
                </p>
              </div>
            </div>

            {/* Campaign Summary Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Campaign Title:</span>
                <span className="font-bold text-slate-900">{campaignTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Message Type:</span>
                <span className="font-mono font-bold text-slate-800 uppercase text-[10px]">{campaignType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Audience:</span>
                <span className="font-bold text-slate-800">{audienceType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Eligible Recipients:</span>
                <span className="font-mono text-emerald-700 text-sm">{audienceMetrics.eligible.length} Patients</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Excluded Opted-Out: {audienceMetrics.optedOut.length}</span>
                <span>Excluded Invalid Phone: {audienceMetrics.invalid.length}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Anti-Duplicate Protection: This broadcast will be locked with an idempotency key to prevent accidental duplicate sends.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedBroadcast}
                className="px-6 py-2.5 bg-[#075e54] hover:bg-[#128c7e] text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Send Broadcast</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: LIVE BROADCAST PROGRESS & QUEUE MONITOR               */}
      {/* ============================================================== */}
      {isBroadcasting && broadcastProgress && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#075e54] flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <MessageCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Broadcasting WhatsApp Messages...
              </h3>
              <p className="text-xs text-slate-500">
                Transmitting campaign to registered clinic patient queue
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Progress: {broadcastProgress.processed} / {broadcastProgress.total}</span>
                <span>{Math.round((broadcastProgress.processed / Math.max(broadcastProgress.total, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-[#075e54] to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((broadcastProgress.processed / Math.max(broadcastProgress.total, 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 font-bold block">Submitted Successfully</span>
                <span className="text-lg font-black text-emerald-900">{broadcastProgress.stats.submitted}</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-800 font-bold block">Failed</span>
                <span className="text-lg font-black text-rose-900">{broadcastProgress.stats.failed}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#075e54]" />
              <span>Please do not close this modal until transmission finishes.</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
