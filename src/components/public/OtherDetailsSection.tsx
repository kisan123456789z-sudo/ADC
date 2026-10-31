import React from 'react';
import { 
  Gift, 
  Cpu, 
  HeartPulse, 
  ShieldCheck, 
  Sparkles, 
  Calendar,
  CheckCircle,
  Clock,
  Check
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface OtherDetailsSectionProps {
  onBookClick: () => void;
}

export const OtherDetailsSection: React.FC<OtherDetailsSectionProps> = ({ onBookClick }) => {
  const { highlights } = useClinic();

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Gift': return <Gift className="w-6 h-6" />;
      case 'Cpu': return <Cpu className="w-6 h-6" />;
      case 'HeartPulse': return <HeartPulse className="w-6 h-6" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <section id="highlights" className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Clinic Highlights & Sunday Camp
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Patients Choose Anujay Dental Clinic
          </h2>
          <p className="text-base text-slate-600">
            From our weekly free community checkups to high-end German dental tech, 
            discover what sets our patient experience apart.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => (
            <div
              key={item.id ? `${item.id}-${idx}` : `item-${idx}`}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Badge + Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    {renderIcon(item.iconName)}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-700 font-bold">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified Clinic Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Big Sunday Banner Callout */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-sky-200">
                <Clock className="w-3.5 h-3.5" />
                Every Sunday • 10:00 AM to 2:00 PM
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Free Community Dental Checkup & Digital X-Ray
              </h3>
              <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                Take the first step towards healthy teeth without worrying about consultation fees. 
                Full oral examination, intraoral camera check, and transparent treatment planning with Dr. Anujay.
              </p>
            </div>

            <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
              <button
                type="button"
                onClick={onBookClick}
                className="px-6 py-3.5 bg-white text-blue-950 font-extrabold text-sm rounded-2xl shadow-lg hover:bg-blue-50 transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>Book Sunday Checkup</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
