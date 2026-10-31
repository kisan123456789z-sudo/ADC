import React, { useState } from 'react';
import { 
  Play, 
  Calendar, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Check, 
  Video, 
  Smile, 
  Activity, 
  HeartPulse, 
  Award, 
  SmilePlus, 
  Anchor 
} from 'lucide-react';
import { DentalService } from '../../types/clinic';
import { useClinic } from '../../context/ClinicContext';

interface ServicesSectionProps {
  onSelectService: (serviceName: string) => void;
  onOpenVideo: (service: DentalService) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ 
  onSelectService, 
  onOpenVideo 
}) => {
  const { services } = useClinic();

  // Helper icon renderer
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Anchor': return <Anchor className="w-5 h-5" />;
      case 'Smile': return <Smile className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'SmilePlus': return <SmilePlus className="w-5 h-5" />;
      case 'ShieldAlert':
      default:
        return <ShieldAlert className="w-5 h-5" />;
    }
  };

  return (
    <section id="services" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Transparent Pricing & Treatments
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Multi-Specialty Dental Services
          </h2>
          <p className="text-base text-slate-600">
            Every procedure is carried out with international safety protocols, micro-precision equipment, 
            and upfront pricing. Watch our procedure explainer videos below to learn more.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, idx) => (
            <div 
              key={service.id ? `${service.id}-${idx}` : `srv-${idx}`}
              className="group flex flex-col bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Optional Service Photo Thumbnail Header */}
              {service.imageUrl && (
                <div className="-mx-6 -mt-6 mb-4 aspect-video overflow-hidden relative bg-slate-900">
                  <img 
                    src={service.imageUrl} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {service.duration}
                  </span>
                </div>
              )}

              {/* Top row: Icon + Duration */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100/70 text-blue-700 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {renderIcon(service.icon)}
                </div>
                {!service.imageUrl && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white group-hover:bg-blue-50 px-2.5 py-1 rounded-full border border-slate-200">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>{service.duration}</span>
                  </div>
                )}
              </div>

              {/* Service Title */}
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors leading-snug">
                {service.name}
              </h3>

              {/* Price Tag (Prominently displayed) */}
              <div className="mt-2 mb-3">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-700">{service.price}</span>
                  <span className="text-xs text-slate-500 font-medium">(Pay at Clinic)</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-3">
                {service.description}
              </p>

              {/* Features bullets */}
              <ul className="space-y-1.5 mb-6 text-[11px] text-slate-700 font-medium">
                {service.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Action Buttons: Embedded Video Demo & Book Service */}
              <div className="mt-auto space-y-2 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onOpenVideo(service)}
                  className="w-full py-2 px-3 bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-3.5 h-3.5 text-blue-700 fill-blue-700" />
                  <span>Watch Procedure Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectService(service.name)}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book This Service</span>
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Cash payment guarantee note */}
        <div className="mt-12 p-5 bg-blue-50/80 border border-blue-200 rounded-3xl max-w-2xl mx-auto flex items-center gap-4 text-xs text-blue-950">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">No Advance Online Payment Required</p>
            <p className="text-blue-800 mt-0.5">
              Book your appointment freely online. Consultation and procedure charges are payable at the clinic counter via cash after your treatment is concluded.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
