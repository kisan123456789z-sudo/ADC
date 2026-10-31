import React, { useState } from 'react';
import { Camera, Eye, X, Sparkles, Filter } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { ClinicPhoto } from '../../types/clinic';

export const PhotosGallery: React.FC = () => {
  const { gallery } = useClinic();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<ClinicPhoto | null>(null);

  const categories = ['All', 'Reception', 'Treatment', 'Machines', 'Sterilization'];

  const filteredPhotos = selectedCategory === 'All' 
    ? gallery 
    : gallery.filter(p => p.category === selectedCategory);

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-slate-50 border-y border-slate-200/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            Infrastructure & Facilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Take a Virtual Tour of Anujay Dental Clinic
          </h2>
          <p className="text-base text-slate-600">
            A hygienic, patient-first environment designed with ultra-modern German dental chairs, 
            low-radiation digital imaging, and Class-B hospital sterilization.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Spaces' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id ? `${photo.id}-${idx}` : `ph-${idx}`}
              onClick={() => setActivePhoto(photo)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 bg-white/90 text-slate-900 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Eye className="w-5 h-5 text-blue-700" />
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-blue-900 shadow-sm">
                  {photo.category}
                </div>
              </div>

              {/* Caption */}
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                  {photo.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {photo.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={activePhoto.url}
                alt={activePhoto.title}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
            <div className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                  {activePhoto.category}
                </span>
                <span className="text-xs text-slate-400">Anujay Dental Clinic Infrastructure</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{activePhoto.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{activePhoto.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
