import React from 'react';
import { X, MapPin, Navigation, Clock, Phone, ExternalLink } from 'lucide-react';
import { ClinicSettings } from '../../types/clinic';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClinicSettings;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <MapPin className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Clinic Location & Directions</h3>
              <p className="text-xs text-blue-100">{settings.clinicName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Map iframe preview */}
          <div className="w-full h-52 sm:h-72 bg-slate-100 relative">
            <iframe 
              title="AnuJay Dental Clinic Map Location"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=21.2202723,81.3567154&z=17&hl=en&output=embed"
            />
          </div>

          {/* Address and details */}
          <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">Full Address</p>
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                {settings.address && settings.address.includes('Utsav Bhavan') 
                  ? settings.address 
                  : 'Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500">Opening Timing</p>
                <p className="text-xs font-semibold text-slate-800">
                  {settings.openingHours || '10:00 AM - 2:00 PM, 5:00 PM - 9:00 PM (Mon-Sat)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500">Contact Desk</p>
                <p className="text-xs font-semibold text-slate-800">{settings.phone || '+91 98765 43210'}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href="https://maps.app.goo.gl/z2c6moS2vPQ87f1V8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Open in Google Maps App
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
