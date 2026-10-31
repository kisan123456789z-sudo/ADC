import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Star, 
  Layers, 
  Calendar,
  Clock, 
  Phone,
  Copy,
  Check,
  Compass,
  Car,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Building2,
  Radio
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface LocationMapSectionProps {
  onBookClick?: () => void;
}

export const LocationMapSection: React.FC<LocationMapSectionProps> = ({ onBookClick }) => {
  const { settings } = useClinic();
  const [mapType, setMapType] = useState<'google' | 'satellite'>('google');
  const [copied, setCopied] = useState(false);

  const clinicName = settings.clinicName || 'AnuJay Dental Clinic';
  const clinicAddress = (settings.address && settings.address.includes('Utsav Bhavan')) 
    ? settings.address 
    : 'Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026';

  const googleMapsUrl = 'https://maps.app.goo.gl/z2c6moS2vPQ87f1V8';
  const directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=21.2202723,81.3567154';
  const satelliteUrl = 'https://www.google.com/maps/@21.2202723,81.3567154,18z/data=!3m1!1e3';

  // Clean, coordinate-based Google Maps embeds (100% clean - no overlay card covering the map)
  const googleEmbedUrl = 'https://maps.google.com/maps?q=21.2202723,81.3567154&z=17&hl=en&output=embed';
  const satelliteEmbedUrl = 'https://maps.google.com/maps?q=21.2202723,81.3567154&t=k&z=18&hl=en&output=embed';

  const cleanWhatsApp = (settings?.whatsappNumber || '919876543210').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello ${clinicName}, I need help finding the clinic location near Utsav Bhavan, Supela.`
  )}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(clinicAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section id="location" className="py-12 sm:py-16 bg-slate-50/60 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-blue-950 text-xs font-bold shadow-2xs mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <span className="tracking-wide">LIVE CLINIC PINPOINT • BHILAI</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">Open All 7 Days (9 AM – 8 PM)</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Find <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">{clinicName}</span> on Map
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
            Directly opposite Utsav Bhavan, Supela, Bhilai — featuring dedicated parking, wheelchair-accessible ground floor entrance, and open all 7 days.
          </p>
        </div>

        {/* Master Showcase: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN: Clinic Destination Card (Attractive, Informative & High-Converting) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-blue-950/5 relative overflow-hidden">
            
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

            <div>
              {/* Header: Verified Google Business & Live Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  Open Today: 9 AM – 8 PM
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Google Verified Clinic
                </span>
              </div>

              {/* Title & Star Rating with Live Badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {clinicName}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-extrabold text-[10px] tracking-wider uppercase shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  LIVE
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-1.5 mb-3.5">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-900">4.9 / 5.0</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500">180+ Happy Patient Reviews</span>
              </div>

              {/* Live Clinic Consultation Status Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-sky-500/10 border border-emerald-200/90 mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-emerald-400 opacity-60" />
                    <Radio className="w-4 h-4 text-emerald-700 relative z-10 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Live Clinic Desk Active</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Consulting Patients Now • Walk-ins & Emergencies
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 text-[10px] font-bold border border-emerald-300 shrink-0">
                  ACTIVE
                </span>
              </div>

              {/* Address Card with Copy Button */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 mb-5 relative group hover:border-blue-200 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100/80 text-blue-700 rounded-xl shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Exact Location Address</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug mt-0.5">
                      {clinicAddress}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  title="Copy full clinic address to clipboard"
                >
                  {copied ? (
                    <span className="flex items-center text-[10px] font-bold text-emerald-600 gap-1 px-1">
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Key Highlights & Landmark Guide */}
              <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/90">
                  <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Landmark:</strong> Directly infront of Utsav Bhavan, Supela</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/90">
                  <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Parking:</strong> Dedicated front patient parking (Car & Bike)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/90">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span><strong>Timings:</strong> 9:00 AM – 8:00 PM (Open All 7 Days)</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons Suite */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Get Driving Directions</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition cursor-pointer"
                title="Chat with clinic desk on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>WhatsApp</span>
              </a>
              {onBookClick && (
                <button
                  type="button"
                  onClick={onBookClick}
                  className="inline-flex items-center justify-center gap-1.5 py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Book</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Ultra-Crisp Interactive Map Hub */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-xl shadow-blue-950/5">
            
            {/* Live Animated Clinic Locator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:px-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl mb-3 shadow-md border border-slate-800/90 relative overflow-hidden">
              {/* Subtle ambient light sweep across the live bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />

              <div className="flex items-center gap-3 z-10">
                {/* Multi-ring animated radar beacon */}
                <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="animate-pulse absolute inline-flex h-4 w-4 rounded-full bg-red-500/50" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 ring-2 ring-white/60 shadow-sm" />
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-black text-[10px] tracking-wider uppercase border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    LIVE PINPOINT
                  </span>
                  <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    {clinicName}
                  </span>
                  <span className="text-blue-400 text-xs hidden sm:inline">•</span>
                  <span className="text-slate-300 text-xs hidden sm:inline">
                    Shop no. 3, Infront of Utsav Bhavan, Supela
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Open Now (9 AM – 8 PM)
                </span>
              </div>
            </div>

            {/* Map Mode Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setMapType('google')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    mapType === 'google'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Road Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    mapType === 'satellite'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Satellite Aerial View</span>
                </button>
              </div>

              {/* Direct Open in Google Maps Link */}
              <div className="flex items-center gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
                  title="Open in official Google Maps app"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Maps App</span>
                </a>
              </div>
            </div>

            {/* Map Frame Viewport - 100% Unobstructed, Crystal Clear & Clean (No White Card) */}
            <div className="relative w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
              
              {mapType === 'google' ? (
                <iframe
                  title={`${clinicName} Google Map`}
                  src={googleEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <iframe
                  title={`${clinicName} Satellite View`}
                  src={satelliteEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>

            {/* Bottom Quick Landmark Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2 text-[11px] text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span><strong>5 mins</strong> from Supela Clock Tower</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span><strong>Direct Route</strong> via Kohka-Supela Road</span>
              </div>
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Desk: <strong className="text-slate-800">{settings.phone || '+91 98765 43210'}</strong></span>
              </div>
            </div>

          </div>

        </div>

        {/* 3 Step-by-Step Directions Guide Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-sm transition">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs mb-2.5">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Coming from Supela Chowk / GE Road</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Head towards Kohka/Sunder Nagar road. In approximately 400 meters, you will see Utsav Bhavan on your left; AnuJay Dental Clinic is directly opposite at Shop no. 3.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-sm transition">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs mb-2.5">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Coming from Smriti Nagar / Junwani</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Follow the Kohka-Supela main link road towards Supela. Look for the illuminated AnuJay Dental Clinic ground floor board right in front of Utsav Bhavan.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-sm transition">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs mb-2.5">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Public Transit & Auto Rickshaws</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Frequent auto-rickshaws, e-rickshaws, and city buses drop you right at Utsav Bhavan stop. The clinic entrance is on the ground floor with zero stair climbing.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
