import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Percent, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Tag, 
  AlertCircle, 
  Megaphone, 
  Video, 
  Image as ImageIcon, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Play
} from 'lucide-react';
import { ClinicNotice, NoticeCategory } from '../../types/clinic';
import { getPublicOffersAndNotices } from '../../services/noticeService';
import { NoticeDetailModal } from '../common/NoticeDetailModal';
import { getVideoThumbnailUrl } from '../common/VideoModal';

interface OffersAndNoticesSectionProps {
  onBookClick?: (serviceName?: string) => void;
}

export const OffersAndNoticesSection: React.FC<OffersAndNoticesSectionProps> = ({ 
  onBookClick 
}) => {
  const [notices, setNotices] = useState<ClinicNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalNotice, setActiveModalNotice] = useState<ClinicNotice | null>(null);

  // Load published & valid notices
  useEffect(() => {
    let isMounted = true;
    async function fetchNotices() {
      setIsLoading(true);
      try {
        const data = await getPublicOffersAndNotices();
        if (isMounted) {
          setNotices(data);
        }
      } catch (err) {
        console.error("Failed to load public offers and notices:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchNotices();
    return () => { isMounted = false; };
  }, []);

  // Filter Categories list
  const categoryFilters = [
    { id: 'all', label: 'All Updates', icon: Sparkles },
    { id: 'offer_promotion', label: 'Special Offers & Discounts', icon: Percent },
    { id: 'important_notice', label: 'Important Notices & Announcements', icon: AlertCircle },
    { id: 'custom', label: 'Custom Updates', icon: Tag }
  ];

  // Filter logic
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'offer_promotion') return n.category === 'offer_promotion';
      if (selectedCategory === 'important_notice') return n.category === 'important_notice' || n.category === 'general_announcement';
      if (selectedCategory === 'custom') return n.category === 'custom' || !!n.customCategory || (!['offer_promotion', 'important_notice'].includes(n.category));
      return true;
    });
  }, [notices, selectedCategory]);

  const getCategoryBadgeLabel = (notice: ClinicNotice) => {
    if (notice.customCategory) return notice.customCategory;
    switch (notice.category) {
      case 'offer_promotion': return 'Special Offer';
      case 'important_notice': return 'Important Notice';
      case 'custom': return notice.customCategory || 'Custom Update';
      default: return notice.customCategory || 'Notice';
    }
  };

  const getCategoryColor = (notice: ClinicNotice) => {
    if (notice.customCategory || notice.category === 'custom') {
      return 'bg-purple-100 text-purple-900 border-purple-300';
    }
    switch (notice.category) {
      case 'offer_promotion':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'important_notice':
      default:
        return 'bg-red-100 text-red-900 border-red-300';
    }
  };

  // If no published notices exist at all, return null gracefully
  if (!isLoading && notices.length === 0) {
    return null;
  }

  return (
    <section 
      id="latest-offers-updates" 
      className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 border-b border-slate-200"
      aria-label="Latest Offers and Updates"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinic Bulletin & Privileges</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Latest Offers & Updates
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Discover our latest special offers, clinic announcements, and important updates.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categoryFilters.map(filter => {
            const Icon = filter.icon;
            const isSelected = selectedCategory === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedCategory(filter.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20 scale-102'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
                <div className="h-40 bg-slate-100 rounded-2xl" />
                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-100 rounded-md w-full" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Notices & Offers Grid */}
        {!isLoading && filteredNotices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotices.map(notice => {
              const isOffer = notice.category === 'offer_promotion' || !!notice.mainHighlight;
              const hasHighlight = !!notice.mainHighlight;
              const cardThumbnail = notice.mediaUrl || getVideoThumbnailUrl(notice.videoUrl);
              const hasVideo = Boolean(notice.videoUrl || notice.category === 'educational_video');
              
              return (
                <div
                  key={notice.id || notice.title}
                  onClick={() => setActiveModalNotice(notice)}
                  className={`group bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 relative ${
                    notice.isPinned
                      ? 'border-blue-400/80 ring-2 ring-blue-500/20 shadow-md'
                      : isOffer
                      ? 'border-amber-200/90 shadow-xs hover:border-amber-400'
                      : 'border-slate-200/90 shadow-xs hover:border-blue-300'
                  }`}
                >
                  {/* Top Ribbon / Highlight Header */}
                  {hasHighlight ? (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-5 py-3 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-white/20 rounded-lg">
                          <Percent className="w-4 h-4 text-white" />
                        </span>
                        <span className="text-lg font-black tracking-tight drop-shadow-xs">
                          {notice.mainHighlight}
                        </span>
                      </div>
                      {notice.offerDetails?.couponCode && (
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider block opacity-90 font-medium">Coupon</span>
                          <span className="font-mono font-black text-xs bg-black/20 px-2 py-0.5 rounded border border-white/20">
                            {notice.offerDetails.couponCode}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : notice.priority === 'urgent' ? (
                    <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-5 py-2.5 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-black tracking-wider uppercase">Urgent Clinical Notice</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Priority OPD</span>
                    </div>
                  ) : null}

                  {/* Card Media Preview (Image, Video Thumbnail, or Video Poster) */}
                  {(cardThumbnail || hasVideo) && (
                    <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                      {cardThumbnail ? (
                        <img
                          src={cardThumbnail}
                          alt={notice.videoTitle || notice.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            if (notice.videoUrl) {
                              const yt = getVideoThumbnailUrl(notice.videoUrl);
                              if (yt && e.currentTarget.src !== yt) {
                                e.currentTarget.src = yt;
                                return;
                              }
                            }
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                          <Video className="w-8 h-8 text-sky-400 mb-1.5 opacity-90" />
                          <span className="text-xs text-white font-bold line-clamp-1">{notice.videoTitle || notice.title}</span>
                          <span className="text-[10px] text-sky-300/90 font-medium mt-0.5">Clinical Video Guide</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                      
                      {/* Video Play Button Overlay */}
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-blue-600/95 text-white flex items-center justify-center shadow-xl ring-4 ring-white/40 group-hover:scale-115 group-hover:bg-blue-500 transition-all duration-300">
                            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Video Badge */}
                      {hasVideo && (
                        <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm">
                          <Video className="w-3 h-3 text-sky-400 fill-sky-400" />
                          <span>Video</span>
                        </span>
                      )}

                      {(notice.mediaCaption || notice.videoTitle) && (
                        <span className="absolute bottom-2 left-3 right-3 text-[11px] text-white/95 truncate font-medium drop-shadow-sm">
                          {notice.mediaCaption || notice.videoTitle}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Content Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Tags: Category & Dates */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryColor(notice)}`}>
                          {getCategoryBadgeLabel(notice)}
                        </span>

                        {notice.expiryDate ? (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Valid until {notice.expiryDate}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{notice.publishDate}</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-2 leading-snug">
                        {notice.title}
                      </h3>

                      {/* Summary / Lead */}
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {notice.summary || notice.content}
                      </p>

                      {/* Applicable Services Tag */}
                      {notice.applicableServices && (
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200/60">
                          <Tag className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate"><strong>For:</strong> {notice.applicableServices}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalNotice(notice);
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {onBookClick && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookClick(notice.applicableServices || notice.title);
                          }}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-sky-200" />
                          <span>{notice.ctaText || (isOffer ? 'Claim Offer' : 'Book Visit')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNotices.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto p-8 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Megaphone className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No announcements in this category</h4>
            <p className="text-xs text-slate-500 mt-1">
              Select another category or check back later for new promotional packages and updates.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Show All Updates
            </button>
          </div>
        )}

      </div>

      {/* Full Detail Modal */}
      <NoticeDetailModal
        notice={activeModalNotice}
        isOpen={!!activeModalNotice}
        onClose={() => setActiveModalNotice(null)}
        onBookAppointment={() => {
          if (activeModalNotice && onBookClick) {
            onBookClick(activeModalNotice.applicableServices || activeModalNotice.title);
          }
        }}
      />
    </section>
  );
};
