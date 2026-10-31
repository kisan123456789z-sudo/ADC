import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Tag, 
  Sparkles, 
  Pin, 
  AlertCircle, 
  FileText, 
  Play, 
  CheckCircle2, 
  Phone, 
  Share2, 
  Info, 
  ShieldAlert,
  Percent,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { ClinicNotice } from '../../types/clinic';
import { formatVideoEmbedUrl } from './VideoModal';

interface NoticeDetailModalProps {
  notice: ClinicNotice | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment?: () => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  notice,
  isOpen,
  onClose,
  onBookAppointment
}) => {
  if (!isOpen || !notice) return null;

  const isExpired = notice.expiryDate && notice.expiryDate < new Date().toISOString().slice(0, 10);
  const formattedVideoUrl = notice.videoUrl ? formatVideoEmbedUrl(notice.videoUrl) : null;

  const getCategoryLabel = (n: ClinicNotice) => {
    if (n.customCategory) return n.customCategory;
    switch (n.category) {
      case 'offer_promotion': return 'Special Offer & Discount';
      case 'important_notice': return 'Important Notice';
      case 'custom': return n.customCategory || 'Custom Notice';
      default: return n.customCategory || 'Clinic Notice';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white flex items-center gap-1 shadow-xs animate-pulse"><AlertCircle className="w-3 h-3" /> Urgent Notice</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white flex items-center gap-1"><AlertCircle className="w-3 h-3" /> High Priority</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="p-2 bg-white/10 rounded-xl text-sky-300 shrink-0">
              {notice.category === 'offer_promotion' ? (
                <Percent className="w-5 h-5 text-amber-300" />
              ) : notice.category === 'educational_video' ? (
                <Video className="w-5 h-5 text-purple-300" />
              ) : notice.category === 'photo_poster' ? (
                <ImageIcon className="w-5 h-5 text-emerald-300" />
              ) : (
                <Info className="w-5 h-5 text-sky-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-sky-200 border border-white/10">
                  {getCategoryLabel(notice)}
                </span>
                {getPriorityBadge(notice.priority)}
                {notice.isPinned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-amber-300" /> Pinned
                  </span>
                )}
                {notice.isFeatured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" /> Featured
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate mt-1">
                {notice.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          
          {/* Prominent Highlight Ribbon if available */}
          {notice.mainHighlight && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/20 rounded-xl">
                  <Percent className="w-4 h-4 text-white" />
                </span>
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-90 block">Special Clinic Privilege</span>
                  <span className="text-xl font-black tracking-tight">{notice.mainHighlight}</span>
                </div>
              </div>
              {notice.offerDetails?.couponCode && (
                <div className="bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 text-right">
                  <span className="text-[9px] uppercase tracking-wider block opacity-80">Coupon Code</span>
                  <span className="font-mono font-black text-sm">{notice.offerDetails.couponCode}</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Published: {notice.publishDate}</span>
              </span>
              {notice.expiryDate && (
                <span className={`flex items-center gap-1.5 font-medium ${isExpired ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Valid until: {notice.expiryDate} {isExpired ? '(Expired)' : ''}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              By {notice.authorName} ({notice.authorRole === 'admin' ? 'Clinic Administration' : 'Clinical Staff'})
            </span>
          </div>

          {/* Applicable Services Tag */}
          {notice.applicableServices && (
            <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-center gap-2 text-xs text-blue-900">
              <Tag className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Applicable Procedures:</strong> {notice.applicableServices}</span>
            </div>
          )}

          {/* Video Player if video notice */}
          {formattedVideoUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black aspect-video relative">
              <iframe
                src={formattedVideoUrl}
                title={notice.videoTitle || notice.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Photo / Poster preview if attached */}
          {notice.mediaUrl && !formattedVideoUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 max-h-[380px] flex items-center justify-center">
              <img
                src={notice.mediaUrl}
                alt={notice.title}
                className="max-h-[380px] w-auto max-w-full object-contain rounded-2xl"
              />
            </div>
          )}
          {notice.mediaCaption && (
            <p className="text-xs text-slate-500 italic text-center -mt-2">
              {notice.mediaCaption}
            </p>
          )}

          {/* Special Offer Card if offer notice */}
          {notice.category === 'offer_promotion' && notice.offerDetails && !notice.mainHighlight && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    Exclusive Clinic Benefit
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-amber-950 mt-1">
                    {notice.offerDetails.discountText || 'Special Treatment Savings'}
                  </h4>
                </div>
                {notice.offerDetails.couponCode && (
                  <div className="p-2 sm:px-3 sm:py-1.5 bg-amber-500 text-white font-mono font-black text-xs sm:text-sm rounded-xl tracking-wider shadow-xs flex items-center gap-1.5">
                    <span>CODE:</span>
                    <span className="underline decoration-white/50">{notice.offerDetails.couponCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formatted Content Body */}
          <div className="space-y-3 text-slate-800 leading-relaxed font-normal whitespace-pre-line text-sm sm:text-[15px] bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {notice.content}
          </div>

          {/* Terms and conditions */}
          {(notice.termsAndConditions || notice.offerDetails?.terms) && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                Terms & Conditions:
              </span>
              <p className="text-amber-900/90 leading-relaxed pl-5">
                {notice.termsAndConditions || notice.offerDetails?.terms}
              </p>
            </div>
          )}

          {/* Expired warning if applicable */}
          {isExpired && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>This announcement or promotional package has reached its validity date. Contact reception for current active schedules.</span>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Clinic Helpline: <strong>+91 98765 43210</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {onBookAppointment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookAppointment();
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                <span>{notice.ctaText || 'Book Clinic Visit'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
