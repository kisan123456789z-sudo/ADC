import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Send, 
  Save, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Upload, 
  Sparkles, 
  MessageSquare, 
  X, 
  Calendar, 
  Percent, 
  Video, 
  Image as ImageIcon,
  RotateCcw,
  Info,
  Tag
} from 'lucide-react';
import { 
  ClinicNotice, 
  NoticeCategory, 
  NoticePriority, 
  NoticeStatus 
} from '../../../types/clinic';
import { 
  getNoticesList, 
  saveNoticeRecord 
} from '../../../services/noticeService';
import { useAuth } from '../../../context/AuthContext';
import { compressImageFile } from '../../../utils/fileStorageHelper';
import { NoticeDetailModal } from '../../common/NoticeDetailModal';
import { getVideoThumbnailUrl } from '../../common/VideoModal';
import { SaveButton } from '../../common/SaveButton';

export const StaffNoticeComposer: React.FC = () => {
  const { staffUser } = useAuth();
  const [notices, setNotices] = useState<ClinicNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view: 'composer' | 'my_submissions'
  const [activeSubView, setActiveSubView] = useState<'composer' | 'my_submissions'>('composer');

  // Preview Modal
  const [previewNotice, setPreviewNotice] = useState<ClinicNotice | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Composer Form
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
  
  // Offer & Highlight Details
  const [formMainHighlight, setFormMainHighlight] = useState('');
  const [formApplicableServices, setFormApplicableServices] = useState('');
  const [formCtaText, setFormCtaText] = useState('');
  const [formOfferDiscount, setFormOfferDiscount] = useState('');
  const [formOfferCode, setFormOfferCode] = useState('');
  const [formOfferTerms, setFormOfferTerms] = useState('');

  // Dates
  const [formPublishDate, setFormPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load notices
  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const list = await getNoticesList();
      setNotices(list);
    } catch (err) {
      console.error("Failed to load notices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // Filter staff's own submissions
  const mySubmissions = useMemo(() => {
    const staffPhone = staffUser?.phone?.replace(/\D/g, '') || '';
    const staffName = staffUser?.name?.toLowerCase().trim() || '';

    return notices.filter(n => {
      if (n.authorRole !== 'staff') return false;
      const nPhone = n.authorPhone?.replace(/\D/g, '') || '';
      const nName = n.authorName?.toLowerCase().trim() || '';
      return (staffPhone && nPhone === staffPhone) || (staffName && nName === staffName) || true;
    });
  }, [notices, staffUser]);

  // Reset form
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
  };

  // Load notice into form for editing/resubmission
  const handleEditSubmission = (n: ClinicNotice) => {
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
    setActiveSubView('composer');
  };

  // Handle Media Upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("Optimizing poster image...");
      const { dataUrl } = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        maxSizeBytes: 300 * 1024
      });

      if (dataUrl) {
        setFormMediaUrl(dataUrl);
        showToast("✓ Poster uploaded and verified for submission!");
      }
    } catch {
      showToast("Failed to process image file.");
    }
  };

  // Handle Staff Save (Draft or Submit for Approval)
  const handleStaffSave = async (submitForApproval: boolean): Promise<boolean> => {
    if (!formTitle.trim()) {
      showToast("Please provide a title for the notice.");
      return false;
    }
    if (formCategory === 'custom' && !formCustomCategory.trim()) {
      showToast("Please specify the custom category name.");
      return false;
    }
    if (!formContent.trim()) {
      showToast("Please write notice content.");
      return false;
    }

    setIsSubmitting(true);
    try {
      const targetStatus: NoticeStatus = submitForApproval ? 'pending_approval' : 'draft';
      const actorName = staffUser?.name || 'Staff Nurse';
      const actorPhone = staffUser?.phone || '';

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
        termsAndConditions: formOfferTerms.trim() || undefined,
        mediaType: formMediaType,
        mediaUrl: formMediaUrl.trim() || undefined,
        mediaCaption: formMediaCaption.trim() || undefined,
        videoUrl: formVideoUrl.trim() || undefined,
        videoTitle: formVideoTitle.trim() || undefined,
        offerDetails: formCategory === 'offer_promotion' ? {
          discountText: formMainHighlight.trim() || formOfferDiscount.trim() || undefined,
          couponCode: formOfferCode.trim() || undefined,
          terms: formOfferTerms.trim() || undefined,
          validUntil: formExpiryDate || undefined
        } : undefined,
        publishDate: formPublishDate,
        expiryDate: formExpiryDate.trim() || undefined,
        isPinned: false, // Only admin can pin
        status: targetStatus,
        authorName: actorName,
        authorRole: 'staff',
        authorPhone: actorPhone
      };

      const action = submitForApproval ? 'submitted_for_approval' : (editingNoticeId ? 'updated' : 'created');
      const notes = submitForApproval 
        ? `Submitted for Admin Approval by staff ${actorName}` 
        : `Staff draft saved`;

      await saveNoticeRecord(
        payload,
        { name: actorName, role: 'staff', phone: actorPhone },
        action,
        notes
      );

      await loadNotices();
      setIsSubmitting(false);
      showToast(
        submitForApproval 
          ? "🎉 Notice submitted to Admin Approval Queue!" 
          : "✓ Draft saved in your submissions."
      );
      setTimeout(() => {
        resetForm();
        setActiveSubView('my_submissions');
      }, 1200);
      return true;
    } catch (err: any) {
      setIsSubmitting(false);
      showToast("Failed to submit notice: " + (err.message || 'Error'));
      return false;
    }
  };

  // Category labels helper
  const getCategoryMeta = (cat: NoticeCategory, customCat?: string) => {
    if (customCat?.trim()) {
      return { label: customCat.trim(), color: 'bg-purple-100 text-purple-900 border-purple-200' };
    }
    switch (cat) {
      case 'important_notice': return { label: 'Important Notice', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'offer_promotion': return { label: 'Offer & Package', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'custom': return { label: customCat?.trim() || 'Custom Update', color: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'timing_holiday': return { label: 'Timings & Holidays', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'new_service': return { label: 'New Service', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'photo_poster': return { label: 'Photo & Poster', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'educational_video': return { label: 'Educational Video', color: 'bg-pink-100 text-pink-800 border-pink-200' };
      default: return { label: 'General Announcement', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Staff Notice Header */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-blue-950 p-4 sm:p-6 rounded-3xl text-white shadow-md border border-blue-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2.5 sm:p-3 bg-white/15 rounded-2xl text-sky-200 shrink-0">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">Submit Clinic Notice</h2>
              <span className="text-[10px] uppercase font-black bg-blue-950 text-sky-200 px-2.5 py-0.5 rounded-full border border-sky-400/30 shrink-0">
                Staff Notice Center
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Draft patient announcements, timing revisions, posters, and educational tips for Admin review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView('my_submissions')}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'my_submissions'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>My Submissions ({mySubmissions.length})</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setActiveSubView('composer');
            }}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'composer'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Notice</span>
          </button>
        </div>
      </div>

      {/* Workflow Rule Alert Box */}
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-sky-900">Patient Protection & Approval Guard</p>
          <p className="text-sky-800">
            Submissions made by staff are automatically placed in the <strong>Admin Approval Queue</strong>. Notices will become visible on the Patient Portal only after an authorized clinic administrator reviews and approves them.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW: STAFF NOTICE COMPOSER                                    */}
      {/* ============================================================== */}
      {activeSubView === 'composer' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {editingNoticeId ? 'Edit & Resubmit Notice' : 'Draft New Clinic Notice'}
              </h3>
              <p className="text-xs text-slate-500">
                Prepare patient guidance, festival timings, checkup packages, or educational videos
              </p>
            </div>
            {editingNoticeId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Create New Instead
              </button>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleStaffSave(true); }} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Notice Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Revised Sunday Timings or Free Dental Checkup Day"
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
                  <option value="urgent">Urgent Notice</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Conditional Custom Category Input */}
            {formCategory === 'custom' && (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl animate-in fade-in space-y-1">
                <label className="block font-bold text-purple-950 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Custom Category Title / Tag *</span>
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
                  This custom category tag will be highlighted on the notice board and sent to Admin for approval.
                </p>
              </div>
            )}

            {/* Offer Highlight Badge & Applicable Services */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200 text-xs">
              <div>
                <label className="block font-bold text-amber-950 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Main Highlight</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% OFF, ₹500 OFF, FREE CAMP"
                  value={formMainHighlight}
                  onChange={(e) => setFormMainHighlight(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applicable Procedures</label>
                <input
                  type="text"
                  placeholder="e.g. Scaling & Polishing, All"
                  value={formApplicableServices}
                  onChange={(e) => setFormApplicableServices(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. Claim Offer, Book Visit"
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Short Summary */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Short Teaser Summary</label>
              <input
                type="text"
                placeholder="Brief one-line snippet..."
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            {/* Content Body */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Notice Details & Content *</label>
              <textarea
                rows={5}
                required
                placeholder="Type complete guidance, doctor instructions, holiday dates, or procedure details..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed font-normal"
              />
            </div>

            {/* Special Offer specifics if category === offer_promotion */}
            {formCategory === 'offer_promotion' && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  <span>Promotional Offer Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Discount Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% Off Dental Scaling"
                      value={formOfferDiscount}
                      onChange={(e) => setFormOfferDiscount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Promo Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CLEAN20"
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
                    placeholder="e.g. Valid on prior appointment only."
                    value={formOfferTerms}
                    onChange={(e) => setFormOfferTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Media Attachment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
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
                  <label className="block font-semibold text-slate-700">Upload Poster or Image Link</label>
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
                      placeholder="Paste image URL or upload from device"
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Optional image caption..."
                    value={formMediaCaption}
                    onChange={(e) => setFormMediaCaption(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-[11px]"
                  />

                  {formMediaUrl && (
                    <div className="w-28 h-16 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 mt-1">
                      <img src={formMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {formMediaType === 'video' && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="block font-semibold text-slate-700">YouTube or Video Link</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Video Title..."
                    value={formVideoTitle}
                    onChange={(e) => setFormVideoTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-[11px]"
                  />

                  {formVideoUrl && (
                    <div className="flex items-center gap-3 p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl">
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
                          {getVideoThumbnailUrl(formVideoUrl) ? '✓ Extracted from YouTube' : 'Ready for review'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Publication Date</label>
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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <SaveButton
                type="button"
                variant="secondary"
                defaultText="Save as Draft"
                savingText="Saving Draft..."
                successText="Draft Saved!"
                errorText="Save Failed"
                className="px-4 py-2 font-bold"
                onSave={() => handleStaffSave(false)}
              />
              <SaveButton
                type="button"
                defaultText="Submit for Admin Approval"
                savingText="Submitting..."
                successText="Submitted Successfully"
                errorText="Submission Failed"
                className="px-6 py-2.5 font-bold shadow-md"
                onSave={() => handleStaffSave(true)}
              />
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW: MY SUBMISSIONS & APPROVAL STATUS                         */}
      {/* ============================================================== */}
      {activeSubView === 'my_submissions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">My Notice Submissions</h3>
              <p className="text-xs text-slate-500">Track approval status, admin feedback, and published updates</p>
            </div>
            <button
              onClick={loadNotices}
              className="text-xs text-slate-500 hover:text-blue-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {mySubmissions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                <Megaphone className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Notices Submitted Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't submitted any notices for Admin review. Use the composer above to draft new clinic information.
              </p>
              <button
                onClick={() => setActiveSubView('composer')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Draft First Notice
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mySubmissions.map((n) => {
                const meta = getCategoryMeta(n.category, n.customCategory);
                return (
                  <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.color}`}>
                            {meta.label}
                          </span>

                          {/* Status Badge */}
                          {n.status === 'published' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published Live
                            </span>
                          )}
                          {n.status === 'pending_approval' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Admin Review
                            </span>
                          )}
                          {n.status === 'changes_requested' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-950 rounded-full text-[10px] font-bold border border-orange-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-orange-600" /> Changes Requested
                            </span>
                          )}
                          {n.status === 'rejected' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold border border-red-200">
                              Rejected
                            </span>
                          )}
                          {n.status === 'draft' && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                              Draft
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 mt-1">{n.title}</h4>
                        <p className="text-xs text-slate-500">
                          Submitted on {new Date(n.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewNotice(n)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleEditSubmission(n)}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit & Resubmit</span>
                        </button>
                      </div>
                    </div>

                    {/* Admin Feedback Box if changes requested or rejected */}
                    {n.adminFeedback && (
                      <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-900">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                          <span>Admin Review Feedback:</span>
                        </p>
                        <p className="text-amber-900 leading-relaxed italic">
                          "{n.adminFeedback}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notice Detail Preview Modal */}
      <NoticeDetailModal
        isOpen={Boolean(previewNotice)}
        notice={previewNotice}
        onClose={() => setPreviewNotice(null)}
      />
    </div>
  );
};
