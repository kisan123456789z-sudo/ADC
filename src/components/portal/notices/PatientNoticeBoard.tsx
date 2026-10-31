import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Search, 
  Pin, 
  Calendar, 
  Clock, 
  Tag, 
  Sparkles, 
  Play, 
  Eye, 
  Percent, 
  Video, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  Phone,
  Bookmark
} from 'lucide-react';
import { ClinicNotice, NoticeCategory } from '../../../types/clinic';
import { getPublishedNoticesForPatients } from '../../../services/noticeService';
import { NoticeDetailModal } from '../../common/NoticeDetailModal';

const READ_NOTICES_STORAGE_KEY = 'anujay_patient_read_notices';

interface PatientNoticeBoardProps {
  onBookAppointment?: () => void;
}

export const PatientNoticeBoard: React.FC<PatientNoticeBoardProps> = ({
  onBookAppointment
}) => {
  const [notices, setNotices] = useState<ClinicNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Read status tracking
  const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(READ_NOTICES_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Selected Notice for Full Modal View
  const [selectedNotice, setSelectedNotice] = useState<ClinicNotice | null>(null);

  // Fetch published patient notices
  const loadPublishedNotices = async () => {
    setIsLoading(true);
    try {
      const list = await getPublishedNoticesForPatients();
      setNotices(list);
    } catch (err) {
      console.error("Failed to load patient notices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedNotices();
  }, []);

  // Mark as read when patient opens a notice
  const handleOpenNotice = (notice: ClinicNotice) => {
    setSelectedNotice(notice);
    if (notice.id && !readNoticeIds.has(notice.id)) {
      const updated = new Set(readNoticeIds);
      updated.add(notice.id);
      setReadNoticeIds(updated);
      try {
        localStorage.setItem(READ_NOTICES_STORAGE_KEY, JSON.stringify(Array.from(updated)));
      } catch {}
    }
  };

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch = !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.summary && n.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.customCategory && n.customCategory.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCat = true;
      if (selectedCategory === 'all') {
        matchesCat = true;
      } else if (selectedCategory === 'offer_promotion') {
        matchesCat = n.category === 'offer_promotion';
      } else if (selectedCategory === 'important_notice') {
        matchesCat = n.category === 'important_notice' || n.category === 'general_announcement';
      } else if (selectedCategory === 'custom') {
        matchesCat = n.category === 'custom' || !!n.customCategory || (!['offer_promotion', 'important_notice'].includes(n.category));
      } else {
        matchesCat = n.category === selectedCategory || n.customCategory === selectedCategory;
      }

      return matchesSearch && matchesCat;
    });
  }, [notices, searchQuery, selectedCategory]);

  // Separate pinned announcements
  const pinnedNotices = useMemo(() => {
    return filteredNotices.filter(n => n.isPinned);
  }, [filteredNotices]);

  const standardNotices = useMemo(() => {
    return filteredNotices.filter(n => !n.isPinned);
  }, [filteredNotices]);

  // Category labels and icons helper
  const getCategoryMeta = (cat: NoticeCategory, customCat?: string) => {
    if (customCat) {
      return { label: customCat, color: 'bg-purple-500/10 text-purple-700 border-purple-200' };
    }
    switch (cat) {
      case 'offer_promotion':
        return { label: 'Special Offer', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' };
      case 'custom':
        return { label: customCat || 'Custom Update', color: 'bg-purple-500/10 text-purple-700 border-purple-200' };
      case 'important_notice':
      default:
        return { label: customCat || 'Important Notice', color: 'bg-red-500/10 text-red-700 border-red-200' };
    }
  };

  const categoryFilters = [
    { id: 'all', label: 'All Updates' },
    { id: 'important_notice', label: 'Important Notices' },
    { id: 'offer_promotion', label: 'Special Offers' },
    { id: 'custom', label: 'Custom Updates' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Board Header Banner */}
      <div className="bg-gradient-to-r from-[#00205b] via-[#003366] to-[#00205b] text-white p-6 rounded-3xl shadow-md border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Clinic Updates & Patient Notice Board</h2>
              <span className="text-[10px] font-extrabold uppercase bg-sky-500/30 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded-full">
                Live Notices
              </span>
            </div>
            <p className="text-xs text-sky-200/90 mt-0.5">
              Stay informed with official doctor notices, revised holiday timings, special checkup packages, and dental hygiene videos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-sky-200">
          <Phone className="w-4 h-4 text-sky-400" />
          <span>Reception Helpline: <strong className="text-white">+91 98765 43210</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full sm:w-auto sm:min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notices, timings, offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white transition"
            />
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            Showing {filteredNotices.length} active update{filteredNotices.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          {categoryFilters.map((cat) => {
            const count = cat.id === 'all' 
              ? notices.length 
              : notices.filter(n => n.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PINNED NOTICES SECTION ================= */}
      {pinnedNotices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Pin className="w-4 h-4 fill-amber-600" />
            <span>Pinned Announcements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNotices.map((n) => {
              const meta = getCategoryMeta(n.category, n.customCategory);
              const isRead = n.id ? readNoticeIds.has(n.id) : false;

              return (
                <div
                  key={n.id}
                  onClick={() => handleOpenNotice(n)}
                  className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-5 rounded-3xl border-2 border-amber-300 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-amber-600" /> Pinned Notice
                        </span>
                      </div>

                      {!isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" title="Unread Notice" />
                      )}
                    </div>

                    {n.mediaUrl && (
                      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-48">
                        <img src={n.mediaUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                    )}

                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-900 transition">
                      {n.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {n.summary || n.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-200/80 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{n.publishDate}</span>
                    </span>
                    <span className="font-bold text-blue-900 flex items-center gap-1 group-hover:translate-x-1 transition">
                      <span>Read Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= ALL STANDARD NOTICES ================= */}
      <div className="space-y-3">
        {pinnedNotices.length > 0 && (
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Clinic Updates
          </h3>
        )}

        {filteredNotices.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Active Clinic Notices</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no published announcements in this category. Check back soon for clinic updates, doctor schedules, and offers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardNotices.map((n) => {
              const meta = getCategoryMeta(n.category, n.customCategory);
              const isRead = n.id ? readNoticeIds.has(n.id) : false;

              return (
                <div
                  key={n.id}
                  onClick={() => handleOpenNotice(n)}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.color}`}>
                        {meta.label}
                      </span>
                      {!isRead ? (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          New
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Seen</span>
                      )}
                    </div>

                    {/* Thumbnail if media present */}
                    {n.mediaUrl && (
                      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 max-h-40">
                        <img src={n.mediaUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                    )}

                    {n.videoUrl && !n.mediaUrl && (
                      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 flex items-center justify-center relative">
                        <Play className="w-10 h-10 text-white fill-white/80 group-hover:scale-110 transition" />
                        <span className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-md font-mono">
                          Video Guide
                        </span>
                      </div>
                    )}

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition line-clamp-2">
                      {n.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {n.summary || n.content}
                    </p>

                    {/* Offer badge snippet */}
                    {n.category === 'offer_promotion' && n.offerDetails && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs">
                        <p className="font-bold text-amber-900">{n.offerDetails.discountText || 'Special Offer'}</p>
                        {n.offerDetails.couponCode && (
                          <p className="text-[11px] font-mono text-amber-800">Coupon: <strong>{n.offerDetails.couponCode}</strong></p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="text-[11px]">{n.publishDate}</span>
                    <span className="font-bold text-blue-900 flex items-center gap-1 group-hover:translate-x-1 transition text-xs">
                      <span>View Notice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notice Detail Modal */}
      <NoticeDetailModal
        isOpen={Boolean(selectedNotice)}
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
        onBookAppointment={onBookAppointment}
      />
    </div>
  );
};
