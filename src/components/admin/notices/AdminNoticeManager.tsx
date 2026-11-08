import React, { useState, useEffect, useMemo } from 'react';
import { 
  BellRing, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Pin, 
  AlertCircle, 
  FileText, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload, 
  Sparkles, 
  Search, 
  Filter, 
  Archive, 
  RotateCcw, 
  MessageSquare, 
  Video, 
  Image as ImageIcon, 
  Tag, 
  Percent, 
  ChevronRight, 
  Check, 
  X, 
  History, 
  Send,
  User,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { 
  ClinicNotice, 
  NoticeCategory, 
  NoticePriority, 
  NoticeStatus, 
  NoticeAuditEntry 
} from '../../../types/clinic';
import { 
  getNoticesList, 
  saveNoticeRecord, 
  reviewStaffNotice, 
  togglePinNotice, 
  changeNoticeStatus, 
  deleteNoticeRecord 
} from '../../../services/noticeService';
import { compressImageFile } from '../../../utils/fileStorageHelper';
import { NoticeDetailModal } from '../../common/NoticeDetailModal';
import { formatVideoEmbedUrl, getVideoThumbnailUrl } from '../../common/VideoModal';
import { SaveButton } from '../../common/SaveButton';

export const AdminNoticeManager: React.FC = () => {
  const [notices, setNotices] = useState<ClinicNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'composer' | 'library' | 'audit'>('overview');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview Modal
  const [previewNotice, setPreviewNotice] = useState<ClinicNotice | null>(null);

  // Audit History Modal
  const [auditNotice, setAuditNotice] = useState<ClinicNotice | null>(null);

  // Review Modal (Reject / Request Changes with Comment)
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    noticeId: string;
    action: 'reject' | 'changes_requested';
    noticeTitle: string;
    comment: string;
  }>({
    isOpen: false,
    noticeId: '',
    action: 'changes_requested',
    noticeTitle: '',
    comment: ''
  });

  // In-App Delete Confirmation Modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    noticeId: string;
    title: string;
  }>({
    isOpen: false,
    noticeId: '',
    title: ''
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Composer Form State
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('important_notice');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formPriority, setFormPriority] = useState<NoticePriority>('normal');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMediaType, setFormMediaType] = useState<'none' | 'image' | 'poster' | 'video'>('none');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaCaption, setFormMediaCaption] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formVideoTitle, setFormVideoTitle] = useState('');
  
  // Offer Details
  const [formOfferDiscount, setFormOfferDiscount] = useState('');
  const [formOfferCode, setFormOfferCode] = useState('');
  const [formOfferTerms, setFormOfferTerms] = useState('');

  // Eye-catching Offer & Action Highlights
  const [formMainHighlight, setFormMainHighlight] = useState('');
  const [formApplicableServices, setFormApplicableServices] = useState('');
  const [formCtaText, setFormCtaText] = useState('');
  const [formTermsAndConditions, setFormTermsAndConditions] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  // Scheduling & Pin
  const [formPublishDate, setFormPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch notices
  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const list = await getNoticesList();
      setNotices(list);
    } catch (err) {
      console.error("Failed to load clinic notices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = notices.length;
    const published = notices.filter(n => n.status === 'published').length;
    const pendingApproval = notices.filter(n => n.status === 'pending_approval').length;
    const drafts = notices.filter(n => n.status === 'draft').length;
    const scheduled = notices.filter(n => n.status === 'scheduled').length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const expired = notices.filter(n => n.expiryDate && n.expiryDate < todayStr).length;
    const changesRequested = notices.filter(n => n.status === 'changes_requested').length;
    return { total, published, pendingApproval, drafts, scheduled, expired, changesRequested };
  }, [notices]);

  // Pending staff submissions
  const pendingStaffNotices = useMemo(() => {
    return notices.filter(n => n.status === 'pending_approval');
  }, [notices]);

  // Filtered Library Notices
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch = !searchQuery.trim() || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.summary && n.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.customCategory && n.customCategory.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || 
        n.category === categoryFilter ||
        (categoryFilter === 'custom' && (n.category === 'custom' || !!n.customCategory));
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [notices, searchQuery, categoryFilter, statusFilter]);

  // Reset / Clear Composer Form
  const resetForm = () => {
    setEditingNoticeId(null);
    setFormTitle('');
    setFormCategory('important_notice');
    setFormCustomCategory('');
    setFormPriority('normal');
    setFormSummary('');
    setFormContent('');
    setFormMainHighlight('');
    setFormApplicableServices('');
    setFormCtaText('');
    setFormTermsAndConditions('');
    setFormIsFeatured(false);
    setFormMediaType('none');
    setFormMediaUrl('');
    setFormMediaCaption('');
    setFormVideoUrl('');
    setFormVideoTitle('');
    setFormOfferDiscount('');
    setFormOfferCode('');
    setFormOfferTerms('');
    setFormPublishDate(new Date().toISOString().slice(0, 10));
    setFormExpiryDate('');
    setFormIsPinned(false);
  };

  // Load existing notice into composer for editing
  const handleEditNotice = (n: ClinicNotice) => {
    setEditingNoticeId(n.id || null);
    setFormTitle(n.title);
    setFormCategory(n.category);
    setFormCustomCategory(n.customCategory || '');
    setFormPriority(n.priority);
    setFormSummary(n.summary || '');
    setFormContent(n.content);
    setFormMainHighlight(n.mainHighlight || '');
    setFormApplicableServices(n.applicableServices || '');
    setFormCtaText(n.ctaText || '');
    setFormTermsAndConditions(n.termsAndConditions || n.offerDetails?.terms || '');
    setFormIsFeatured(!!n.isFeatured);
    setFormMediaType(n.mediaType || 'none');
    setFormMediaUrl(n.mediaUrl || '');
    setFormMediaCaption(n.mediaCaption || '');
    setFormVideoUrl(n.videoUrl || '');
    setFormVideoTitle(n.videoTitle || '');
    if (n.offerDetails) {
      setFormOfferDiscount(n.offerDetails.discountText || '');
      setFormOfferCode(n.offerDetails.couponCode || '');
      setFormOfferTerms(n.offerDetails.terms || '');
    } else {
      setFormOfferDiscount('');
      setFormOfferCode('');
      setFormOfferTerms('');
    }
    setFormPublishDate(n.publishDate || new Date().toISOString().slice(0, 10));
    setFormExpiryDate(n.expiryDate || '');
    setFormIsPinned(n.isPinned);
    setActiveTab('composer');
  };

  // Handle Image / Poster Upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("Optimizing image/poster for notice board...");
      const { dataUrl } = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        maxSizeBytes: 300 * 1024
      });

      if (dataUrl) {
        setFormMediaUrl(dataUrl);
        showToast("✓ Poster uploaded and optimized successfully!");
      }
    } catch {
      showToast("Failed to process image file.");
    }
  };

  // Submit Notice (Admin Action)
  const handleSaveNotice = async (targetStatus: NoticeStatus): Promise<boolean> => {
    if (!formTitle.trim()) {
      showToast("Please provide a notice title.");
      return false;
    }
    if (formCategory === 'custom' && !formCustomCategory.trim()) {
      showToast("Please specify the custom category name.");
      return false;
    }
    if (!formContent.trim()) {
      showToast("Please provide notice content body.");
      return false;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ClinicNotice> = {
        ...(editingNoticeId ? { id: editingNoticeId } : {}),
        title: formTitle.trim(),
        category: formCategory,
        customCategory: formCategory === 'custom' ? formCustomCategory.trim() : undefined,
        priority: formPriority,
        summary: formSummary.trim() || undefined,
        content: formContent.trim(),
        mainHighlight: formMainHighlight.trim() || undefined,
        applicableServices: formApplicableServices.trim() || undefined,
        ctaText: formCtaText.trim() || undefined,
        termsAndConditions: formTermsAndConditions.trim() || undefined,
        isFeatured: formIsFeatured,
        mediaType: formMediaType,
        mediaUrl: formMediaUrl.trim() || (formVideoUrl.trim() ? getVideoThumbnailUrl(formVideoUrl) || undefined : undefined),
        mediaCaption: formMediaCaption.trim() || undefined,
        videoUrl: formVideoUrl.trim() || undefined,
        videoTitle: formVideoTitle.trim() || undefined,
        offerDetails: formCategory === 'offer_promotion' ? {
          discountText: formMainHighlight.trim() || formOfferDiscount.trim() || undefined,
          couponCode: formOfferCode.trim() || undefined,
          terms: formTermsAndConditions.trim() || formOfferTerms.trim() || undefined,
          validUntil: formExpiryDate || undefined
        } : undefined,
        publishDate: formPublishDate,
        expiryDate: formExpiryDate.trim() || undefined,
        isPinned: formIsPinned,
        status: targetStatus
      };

      const action = editingNoticeId ? 'updated' : (targetStatus === 'published' ? 'published' : 'created');
      const notes = editingNoticeId ? 'Updated notice content and configuration' : (targetStatus === 'published' ? 'Direct publication by Admin' : 'Saved draft');

      const res = await saveNoticeRecord(
        payload, 
        { name: 'Dr. Jayesh Sen', role: 'admin' },
        action,
        notes
      );

      await loadNotices();
      setIsSubmitting(false);
      showToast(`✓ Notice successfully ${targetStatus === 'published' ? 'published to Patient Board' : 'saved'}!`);
      setTimeout(() => {
        resetForm();
        setActiveTab('library');
      }, 1200);
      return true;
    } catch (err: any) {
      setIsSubmitting(false);
      showToast("Failed to save notice: " + (err.message || 'Error'));
      return false;
    }
  };

  // Staff Review Action: Approve & Publish
  const handleApproveStaffNotice = async (noticeId: string, directPublish = true) => {
    try {
      const res = await reviewStaffNotice(
        noticeId,
        'approve',
        'Dr. Jayesh Sen',
        directPublish ? 'Approved and published directly to Patient Notice Board' : 'Approved content for schedule',
        directPublish
      );

      if (res.success) {
        showToast(directPublish ? "🎉 Notice approved and published to Patient Notice Board!" : "✓ Notice approved!");
        await loadNotices();
      }
    } catch {
      showToast("Failed to approve notice.");
    }
  };

  // Confirm Review Action (Reject or Changes Requested)
  const handleConfirmReviewAction = async () => {
    if (!reviewModal.comment.trim()) {
      showToast("Please provide guidance feedback for staff.");
      return;
    }

    try {
      const res = await reviewStaffNotice(
        reviewModal.noticeId,
        reviewModal.action,
        'Dr. Jayesh Sen',
        reviewModal.comment.trim()
      );

      if (res.success) {
        showToast(reviewModal.action === 'changes_requested' ? "✓ Changes requested. Feedback sent to Staff Dashboard." : "✓ Notice rejected.");
        setReviewModal(prev => ({ ...prev, isOpen: false }));
        await loadNotices();
      }
    } catch {
      showToast("Failed to record review decision.");
    }
  };

  // Toggle Pin Status
  const handleTogglePin = async (notice: ClinicNotice) => {
    if (!notice.id) return;
    const nextPin = !notice.isPinned;
    await togglePinNotice(notice.id, nextPin, 'Dr. Jayesh Sen');
    showToast(nextPin ? "📌 Notice pinned to the top of Patient Notice Board" : "Notice unpinned");
    await loadNotices();
  };

  // Change Status (Unpublish / Archive)
  const handleStatusChange = async (noticeId: string, status: 'unpublished' | 'archived' | 'published') => {
    await changeNoticeStatus(noticeId, status, 'Dr. Jayesh Sen');
    showToast(`Notice status updated to ${status}.`);
    await loadNotices();
  };

  // Delete Notice Prompt & Confirmation
  const promptDeleteNotice = (notice: ClinicNotice) => {
    setDeleteConfirmModal({
      isOpen: true,
      noticeId: notice.id || '',
      title: notice.title || 'Untitled Notice'
    });
  };

  const confirmDeleteNotice = async () => {
    if (!deleteConfirmModal.noticeId) return;
    try {
      await deleteNoticeRecord(deleteConfirmModal.noticeId);
      showToast("Notice permanently deleted.");
      setDeleteConfirmModal({ isOpen: false, noticeId: '', title: '' });
      await loadNotices();
    } catch (err) {
      console.error("Failed to delete notice:", err);
      showToast("Failed to delete notice. Please try again.");
    }
  };

  // Category labels and icons helper
  const getCategoryMeta = (cat: NoticeCategory, customCat?: string) => {
    if (customCat?.trim()) {
      return { label: customCat.trim(), color: 'bg-purple-100 text-purple-900 border-purple-200' };
    }
    switch (cat) {
      case 'offer_promotion':
        return { label: 'Offer & Discount', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'important_notice':
        return { label: 'Important Notice', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'custom':
        return { label: customCat?.trim() || 'Custom Update', color: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'timing_holiday':
        return { label: 'Timings & Holidays', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'new_service':
        return { label: 'New Service', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'events':
        return { label: 'Clinic Event', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'health_awareness':
        return { label: 'Health Campaign', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'photo_poster':
        return { label: 'Photo & Poster', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'educational_video':
        return { label: 'Educational Video', color: 'bg-pink-100 text-pink-800 border-pink-200' };
      case 'general_announcement':
      default:
        return { label: 'General Announcement', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-6 rounded-3xl text-white shadow-lg border border-purple-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl ring-2 ring-purple-400/30 text-amber-300">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Offers & Notices Management</h2>
              <span className="text-[10px] uppercase font-black bg-purple-950 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-700">
                Offers & Notice Board
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              Publish special offers, discounts, clinic timing announcements, event notices, and educational videos for patients.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingStaffNotices.length > 0 && (
            <button
              onClick={() => setActiveTab('approvals')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Review Staff Submissions ({pendingStaffNotices.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setActiveTab('composer');
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Notice</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs font-bold overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'approvals'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Staff Approval Queue</span>
            {metrics.pendingApproval > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                {metrics.pendingApproval}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('composer')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'composer'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingNoticeId ? 'Edit Notice' : 'Notice Composer'}</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notices Library ({notices.length})</span>
          </button>
        </div>

        <button
          onClick={loadNotices}
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-purple-700 rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: OVERVIEW & METRICS                                  */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Notices</span>
              <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
              <span className="text-[10px] text-slate-500">All created notices</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/30">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Published Live</span>
              <p className="text-2xl font-black text-emerald-800">{metrics.published}</p>
              <span className="text-[10px] text-emerald-600">Active in Patient Portal</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/40">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending Approval</span>
              <p className="text-2xl font-black text-amber-900">{metrics.pendingApproval}</p>
              <span className="text-[10px] text-amber-700">Staff submissions awaiting review</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Drafts</span>
              <p className="text-2xl font-black text-slate-700">{metrics.drafts}</p>
              <span className="text-[10px] text-slate-500">Unpublished drafts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Scheduled</span>
              <p className="text-2xl font-black text-blue-900">{metrics.scheduled}</p>
              <span className="text-[10px] text-blue-600">Future publication dates</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">Expired</span>
              <p className="text-2xl font-black text-red-900">{metrics.expired}</p>
              <span className="text-[10px] text-red-600">Reached expiry date</span>
            </div>
          </div>

          {/* Pending Approval Attention Box */}
          {pendingStaffNotices.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {pendingStaffNotices.length} Staff Notice{pendingStaffNotices.length > 1 ? 's' : ''} Awaiting Approval
                  </h3>
                  <p className="text-xs text-amber-800">
                    Clinical staff have submitted new information for patients. Review the content before authorizing publication.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('approvals')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Open Approval Queue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Recent Notices Snapshot */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Notices on Board</h3>
                <p className="text-xs text-slate-500">Latest announcements visible to clinic patients</p>
              </div>
              <button
                onClick={() => setActiveTab('library')}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                <span>View All ({notices.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notices.slice(0, 3).map((n) => {
                const meta = getCategoryMeta(n.category, n.customCategory);
                return (
                  <div key={n.id} className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition shadow-xs flex flex-col justify-between space-y-3 bg-slate-50/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                        {n.isPinned && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{n.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {n.summary || n.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                      <span>Date: {n.publishDate}</span>
                      <button
                        onClick={() => setPreviewNotice(n)}
                        className="font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: STAFF APPROVAL QUEUE                                */}
      {/* ============================================================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-5">
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <p className="font-bold text-amber-900">Dedicated Staff Submission Approval Workflow</p>
              <p className="text-amber-800">
                Staff submissions remain strictly invisible to patients until you review and authorize them. You may directly publish, request specific edits, or reject the submission with comments.
              </p>
            </div>
          </div>

          {pendingStaffNotices.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending staff notices awaiting review. When clinical staff submit notices, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingStaffNotices.map((n) => {
                const meta = getCategoryMeta(n.category, n.customCategory);
                return (
                  <div key={n.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Admin Approval
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{n.title}</h3>
                        <p className="text-xs text-slate-500">
                          Submitted by <strong className="text-slate-800">{n.authorName}</strong> ({n.authorRole}) • {new Date(n.updatedAt).toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setPreviewNotice(n)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Full Preview</span>
                        </button>
                        <button
                          onClick={() => setReviewModal({
                            isOpen: true,
                            noticeId: n.id || '',
                            action: 'changes_requested',
                            noticeTitle: n.title,
                            comment: ''
                          })}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>
                        <button
                          onClick={() => setReviewModal({
                            isOpen: true,
                            noticeId: n.id || '',
                            action: 'reject',
                            noticeTitle: n.title,
                            comment: ''
                          })}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleApproveStaffNotice(n.id || '', true)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Preview Snippet */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {n.content}
                    </div>

                    {/* Attached Media Indicator */}
                    {n.mediaUrl && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 p-2 bg-slate-100/60 rounded-xl">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <span>Attached Poster / Image: <strong className="text-slate-900">{n.mediaCaption || 'Media Attached'}</strong></span>
                      </div>
                    )}
                    {n.videoUrl && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 p-2 bg-slate-100/60 rounded-xl">
                        <Video className="w-4 h-4 text-pink-600" />
                        <span>Attached Educational Video: <strong className="text-slate-900">{n.videoTitle || n.videoUrl}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: NOTICE COMPOSER (ADMIN CREATION & DIRECT PUBLISH)   */}
      {/* ============================================================== */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form: Notice Editor (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingNoticeId ? 'Edit Clinic Notice' : 'Compose Clinic Notice'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingNoticeId ? 'Update details, validity, or publication status' : 'Create announcements, timing updates, offers, and patient guidance'}
                </p>
              </div>

              {editingNoticeId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-purple-700 font-bold hover:underline"
                >
                  Create New Instead
                </button>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveNotice('published'); }} className="space-y-4 text-xs">
              
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Extended Emergency Timings or Diwali Scaling Package"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:bg-white transition"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  >
                    <option value="important_notice">Important Clinic Notice</option>
                    <option value="offer_promotion">Special Offer & Discount</option>
                    <option value="custom">Custom Category (Enter below)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as NoticePriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Critical Notice</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Conditional Custom Category Input */}
              {formCategory === 'custom' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl animate-in fade-in space-y-1">
                  <label className="block font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Custom Category Title / Label *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Dental Camp, Equipment Arrival, Holiday Notice..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-bold text-purple-950 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-purple-700">
                    This custom category tag will be highlighted on the patient notice board and banners.
                  </p>
                </div>
              )}

              {/* Eye-catching Highlight & Applicable Services (Prominent Preview) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200">
                <div>
                  <label className="block font-bold text-amber-950 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Main Highlight Badge</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50% OFF, ₹500 OFF, FREE CHECKUP"
                    value={formMainHighlight}
                    onChange={(e) => setFormMainHighlight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 font-black text-xs placeholder:font-normal"
                  />
                  <span className="text-[10px] text-amber-800/80 mt-0.5 block">Most noticeable text on preview card</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Applicable Procedures
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ultrasonic Scaling, Root Canal, All"
                    value={formApplicableServices}
                    onChange={(e) => setFormApplicableServices(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Displays as service tag on card</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Action CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Claim Offer, Book Visit"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Button text on card & modal</span>
                </div>
              </div>

              {/* Short Summary */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Short Summary (Preview Lead)
                </label>
                <input
                  type="text"
                  placeholder="Brief one-line teaser shown on the card..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Full Content Body */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notice Content Body *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write complete notice information, timings, treatment details, guidelines..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed font-normal"
                />
              </div>

              {/* Offer Details if category === 'offer_promotion' */}
              {formCategory === 'offer_promotion' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-600" />
                    <span>Special Promotional Package Fields</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Discount Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Flat ₹500 Off Ultrasonic Scaling"
                        value={formOfferDiscount}
                        onChange={(e) => setFormOfferDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Promo Coupon Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SMILEFEST"
                        value={formOfferCode}
                        onChange={(e) => setFormOfferCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-amber-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                    <input
                      type="text"
                      placeholder="e.g. Valid on full mouth scaling appointments only. One coupon per patient."
                      value={formOfferTerms}
                      onChange={(e) => setFormOfferTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Media Attachments Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Media Attachment</span>
                  </span>
                  <select
                    value={formMediaType}
                    onChange={(e) => setFormMediaType(e.target.value as any)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="none">No Attachment</option>
                    <option value="poster">Poster / Photo</option>
                    <option value="video">Educational Video</option>
                  </select>
                </div>

                {formMediaType === 'poster' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block font-semibold text-slate-700">Upload Poster / Image or Web URL</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste image link or click upload"
                        value={formMediaUrl}
                        onChange={(e) => setFormMediaUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional caption for image..."
                      value={formMediaCaption}
                      onChange={(e) => setFormMediaCaption(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-[11px]"
                    />

                    {formMediaUrl && (
                      <div className="w-32 h-20 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 mt-1">
                        <img src={formMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {formMediaType === 'video' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block font-semibold text-slate-700">Video Link (YouTube Watch / Embed URL)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Video Title (e.g. Proper Brushing Technique)"
                      value={formVideoTitle}
                      onChange={(e) => setFormVideoTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-[11px]"
                    />

                    {formVideoUrl && (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-24 aspect-video rounded-lg overflow-hidden bg-slate-900 relative shrink-0">
                          <img
                            src={getVideoThumbnailUrl(formVideoUrl, formMediaUrl) || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80'}
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Video className="w-4 h-4 text-white fill-current" />
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-600 min-w-0">
                          <p className="font-bold text-slate-800">Video Thumbnail Preview</p>
                          <p className="text-slate-500 truncate">
                            {getVideoThumbnailUrl(formVideoUrl) ? '✓ Extracted from YouTube' : 'Ready for playback'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dates & Pinned Announcement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publication Date</label>
                  <input
                    type="date"
                    required
                    value={formPublishDate}
                    onChange={(e) => setFormPublishDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Optional Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Pin & Featured Spotlight Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 bg-amber-50/50 border border-amber-200 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
                  />
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Pin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pin to Top of Board</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Feature on Homepage Spotlight</span>
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <SaveButton
                  type="button"
                  variant="secondary"
                  defaultText="Save as Draft"
                  savingText="Saving Draft..."
                  successText="Draft Saved!"
                  errorText="Save Failed"
                  className="px-4 py-2.5 font-bold"
                  onSave={() => handleSaveNotice('draft')}
                />
                <SaveButton
                  type="button"
                  defaultText={editingNoticeId ? 'Update & Publish' : 'Publish Directly to Board'}
                  savingText="Publishing..."
                  successText="Published Successfully"
                  errorText="Publish Failed"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md"
                  onSave={() => handleSaveNotice('published')}
                />
              </div>
            </form>
          </div>

          {/* Right Column: Live Board Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Live Patient Board Preview
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Real-time Simulation
                </span>
              </div>

              {/* Mock Patient Card */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getCategoryMeta(formCategory).color}`}>
                    {getCategoryMeta(formCategory).label}
                  </span>
                  {formIsPinned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                    </span>
                  )}
                </div>

                {(formMediaUrl || (formMediaType === 'video' && formVideoUrl)) && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative group">
                    <img 
                      src={formMediaUrl || getVideoThumbnailUrl(formVideoUrl) || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80'} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    {formMediaType === 'video' && formVideoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                          <Video className="w-4 h-4 fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {formTitle || 'Your Announcement Title Appears Here'}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {formSummary || formContent || 'Write content on the left to see the realistic patient-facing presentation in real-time...'}
                </p>

                {formCategory === 'offer_promotion' && (formOfferDiscount || formOfferCode) && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-amber-900">{formOfferDiscount || 'Special Savings'}</p>
                    {formOfferCode && (
                      <p className="text-[11px] font-mono text-amber-800">Coupon: <strong>{formOfferCode}</strong></p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                  <span>Publish Date: {formPublishDate}</span>
                  <span className="text-purple-700 font-bold">Read Full Notice →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: NOTICES LIBRARY & TABLE                             */}
      {/* ============================================================== */}
      {activeTab === 'library' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search notices by title, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="draft">Drafts</option>
                <option value="changes_requested">Changes Requested</option>
                <option value="rejected">Rejected</option>
                <option value="unpublished">Unpublished</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="important_notice">Important Clinic Notices</option>
                <option value="offer_promotion">Offers & Discounts</option>
                <option value="custom">Custom Categories</option>
              </select>
            </div>
          </div>

          {/* Notices Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pin</th>
                  <th className="py-3 px-4">Notice Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Publish Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No clinic notices found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((n) => {
                    const meta = getCategoryMeta(n.category, n.customCategory);
                    return (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Pin Button */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(n)}
                            title={n.isPinned ? "Click to unpin" : "Click to pin to top of board"}
                            className="p-1 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            <Pin className={`w-4 h-4 ${n.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                          </button>
                        </td>

                        {/* Title */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 truncate">{n.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{n.summary || n.content}</p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>

                        {/* Author */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-800 font-bold block">{n.authorName}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{n.authorRole}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {n.status === 'published' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                              Published
                            </span>
                          )}
                          {n.status === 'pending_approval' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold border border-amber-200 animate-pulse">
                              Pending Review
                            </span>
                          )}
                          {n.status === 'changes_requested' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-900 rounded-full text-[10px] font-bold border border-orange-200">
                              Changes Requested
                            </span>
                          )}
                          {n.status === 'draft' && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200">
                              Draft
                            </span>
                          )}
                          {n.status === 'rejected' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold border border-red-200">
                              Rejected
                            </span>
                          )}
                          {n.status === 'unpublished' && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                              Unpublished
                            </span>
                          )}
                          {n.status === 'archived' && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full text-[10px] font-bold">
                              Archived
                            </span>
                          )}
                        </td>

                        {/* Publish Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {n.publishDate}
                          {n.expiryDate && (
                            <span className="block text-[10px] text-slate-400">Exp: {n.expiryDate}</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewNotice(n)}
                              title="Preview as Patient"
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setAuditNotice(n)}
                              title="View Audit Trail"
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleEditNotice(n)}
                              title="Edit Notice"
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {n.status === 'published' ? (
                              <button
                                onClick={() => handleStatusChange(n.id || '', 'unpublished')}
                                title="Unpublish from Patient Portal"
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(n.id || '', 'published')}
                                title="Publish to Patient Portal"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => promptDeleteNotice(n)}
                              title="Delete Permanently"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REVIEW ACTION MODAL (REJECT / REQUEST CHANGES WITH COMMENT)    */}
      {/* ============================================================== */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {reviewModal.action === 'changes_requested' ? 'Request Notice Changes' : 'Reject Staff Notice'}
              </h3>
              <button
                onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Notice: <strong className="text-slate-900">{reviewModal.noticeTitle}</strong>
            </p>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">
                Admin Feedback / Guidance for Staff *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain the required modifications, corrections, or rationale for this review decision..."
                value={reviewModal.comment}
                onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReviewAction}
                className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs ${
                  reviewModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AUDIT TRAIL MODAL                                              */}
      {/* ============================================================== */}
      {auditNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-base text-slate-900">Notice Audit Trail</h3>
              </div>
              <button
                onClick={() => setAuditNotice(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 shrink-0">
              Notice: <strong className="text-slate-900">{auditNotice.title}</strong>
            </p>

            <div className="overflow-y-auto space-y-3 pr-1 text-xs">
              {auditNotice.auditHistory && auditNotice.auditHistory.length > 0 ? (
                auditNotice.auditHistory.map((entry, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-400">
                        {new Date(entry.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      By {entry.performedBy} ({entry.performedByRole})
                    </p>
                    {entry.notes && (
                      <p className="text-slate-600 text-[11px] italic bg-white p-2 rounded-xl border border-slate-100 mt-1">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-6">No audit records found.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => setAuditNotice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Permanent Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Notice Permanently?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100 text-xs text-red-900">
              <span className="font-semibold text-slate-700">Notice: </span>
              <strong className="text-red-950 font-bold">{deleteConfirmModal.title}</strong>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this offer/notice from both the clinic records and the patient portal?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, noticeId: '', title: '' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteNotice}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail / Patient View Preview Modal */}
      <NoticeDetailModal
        isOpen={Boolean(previewNotice)}
        notice={previewNotice}
        onClose={() => setPreviewNotice(null)}
      />
    </div>
  );
};
