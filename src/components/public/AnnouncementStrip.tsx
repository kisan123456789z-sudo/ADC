import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Tag, 
  Clock, 
  ChevronRight, 
  X, 
  ChevronLeft, 
  AlertCircle 
} from 'lucide-react';
import { ClinicNotice } from '../../types/clinic';
import { getPublicOffersAndNotices } from '../../services/noticeService';

interface AnnouncementStripProps {
  onOpenNotice: (notice: ClinicNotice) => void;
  onBookClick?: () => void;
}

export const AnnouncementStrip: React.FC<AnnouncementStripProps> = ({ 
  onOpenNotice,
  onBookClick 
}) => {
  const [announcements, setAnnouncements] = useState<ClinicNotice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(true); // default true until checked

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        const notices = await getPublicOffersAndNotices();
        // Priority for strip: pinned OR urgent OR featured
        const highPriority = notices.filter(n => n.isPinned || n.priority === 'urgent' || n.isFeatured || n.category === 'offer_promotion');
        const items = highPriority.length > 0 ? highPriority : notices.slice(0, 3);
        
        if (isMounted) {
          setAnnouncements(items);
          if (items.length > 0) {
            // Check session dismissal for latest item
            const dismissedId = sessionStorage.getItem('anujay_clinic_announcement_dismissed_id');
            const latestId = items[0]?.id;
            if (dismissedId !== latestId) {
              setIsDismissed(false);
            }
          }
        }
      } catch (err) {
        console.error("Error loading announcement strip:", err);
      }
    }

    loadAnnouncements();
    return () => { isMounted = false; };
  }, []);

  if (isDismissed || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex] || announcements[0];

  const handleDismiss = () => {
    setIsDismissed(true);
    if (current?.id) {
      sessionStorage.setItem('anujay_clinic_announcement_dismissed_id', current.id);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const isOffer = current.category === 'offer_promotion' || !!current.mainHighlight;

  return (
    <div 
      role="region" 
      aria-label="Clinic announcement strip"
      className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white border-b border-indigo-700/50 shadow-xs relative z-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
        
        {/* Left: Badge & Notice Content */}
        <div 
          onClick={() => onOpenNotice(current)}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
        >
          {/* Badge */}
          <div className="shrink-0 flex items-center gap-1">
            {current.priority === 'urgent' ? (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Urgent OPD
              </span>
            ) : current.mainHighlight ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 fill-amber-950" />
                {current.mainHighlight}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Megaphone className="w-3 h-3 text-sky-300" />
                Notice
              </span>
            )}
          </div>

          {/* Title & Short Summary */}
          <div className="min-w-0 flex-1 flex items-center gap-2 truncate">
            <span className="font-bold text-white group-hover:underline truncate text-xs sm:text-[13px]">
              {current.title}
            </span>
            {current.summary && (
              <span className="hidden md:inline text-indigo-200 text-xs truncate">
                — {current.summary}
              </span>
            )}
            {current.offerDetails?.couponCode && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-white/15 border border-white/20 rounded font-mono font-bold text-[10px] text-amber-200 shrink-0">
                Code: {current.offerDetails.couponCode}
              </span>
            )}
          </div>

          {/* Action indicator */}
          <span className="hidden sm:flex items-center gap-0.5 text-sky-300 font-bold text-[11px] shrink-0 group-hover:translate-x-1 transition-transform">
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Right: Controls & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          {announcements.length > 1 && (
            <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5 mr-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous announcement"
                className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono px-1 text-slate-300">
                {currentIndex + 1}/{announcements.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next announcement"
                className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement bar"
            className="p-1 text-indigo-300 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
