import React from 'react';
import { X, Play, ShieldAlert, Sparkles, Video } from 'lucide-react';
import { DentalService } from '../../types/clinic';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: DentalService | null;
  onBookNow?: (serviceName: string) => void;
}

export function formatVideoEmbedUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  // YouTube watch link or short link
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }
  // Vimeo link
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
  }
  return trimmed;
}

export function getVideoThumbnailUrl(videoUrl?: string, fallbackImageUrl?: string): string | null {
  if (fallbackImageUrl && fallbackImageUrl.trim()) {
    return fallbackImageUrl.trim();
  }
  if (!videoUrl) return null;
  const trimmed = videoUrl.trim();
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return null;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, service, onBookNow }) => {
  if (!isOpen || !service) return null;

  const embedUrl = formatVideoEmbedUrl(service.videoUrl);
  const isDirectVideo = service.videoUrl && (
    service.videoUrl.startsWith('data:video') || 
    service.videoUrl.endsWith('.mp4') || 
    service.videoUrl.endsWith('.webm') ||
    service.videoUrl.includes('.mp4?')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-sky-400 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{service.name}</h3>
              <p className="text-xs text-slate-400">{service.videoTitle || 'Procedure Demonstration & Explanation'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player / Embed */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
          {service.videoUrl ? (
            isDirectVideo ? (
              <video
                src={service.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title={service.videoTitle || service.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : service.imageUrl ? (
            <div className="relative w-full h-full">
              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center p-6 text-center text-white">
                <div>
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-sky-400" />
                  <p className="font-bold text-base">{service.name}</p>
                  <p className="text-xs text-slate-200 mt-1">High-definition visual demonstration available at clinic.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400">
              <Play className="w-12 h-12 mx-auto mb-3 text-sky-400 opacity-60" />
              <p className="font-semibold text-white">Interactive 3D Dental Video Simulation</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">Our high-resolution intraoral cameras and 3D simulation videos are demonstrated live to each patient on operatory monitors prior to treatment.</p>
            </div>
          )}
        </div>

        {/* Footer info & CTA */}
        <div className="p-4 sm:p-6 bg-slate-50 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-blue-800">{service.price}</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-900 font-semibold rounded-full">
                  {service.duration}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onBookNow) onBookNow(service.name);
              }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Book This Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
