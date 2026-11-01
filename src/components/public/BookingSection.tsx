import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  User, 
  Phone, 
  Clock, 
  Stethoscope, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Sparkles,
  ShieldCheck,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface BookingSectionProps {
  preSelectedService?: string;
}

export const BookingSection: React.FC<BookingSectionProps> = ({ preSelectedService = '' }) => {
  const { services, addBooking, settings } = useClinic();

  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(preSelectedService || (services[0]?.name || 'Single Sitting Root Canal (RCT)'));
  const [date, setDate] = useState(() => {
    // Tomorrow by default
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().slice(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState('11:00 AM');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    name: string;
    phone: string;
    service: string;
    date: string;
    timeSlot: string;
    fee: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const timeSlots = [
    '09:30 AM', '10:30 AM', '11:30 AM', '12:30 PM',
    '02:30 PM', '03:30 PM', '04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM'
  ];

  // Calculate estimated fee based on service
  const matchedService = services.find(s => s.name === service);
  const estimatedFee = matchedService ? matchedService.numericPrice : 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim() || !date) {
      setErrorMessage('Please fill in your name, mobile number, and desired date.');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    const res = await addBooking({
      patientName: patientName.trim(),
      phone: cleanPhone,
      service,
      date,
      timeSlot,
      problemDescription: problemDescription.trim() || 'General consultation & treatment',
      fee: estimatedFee
    });
    setIsSubmitting(false);

    if (res.success) {
      // Trigger festive celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSubmittedBooking({
        name: patientName.trim(),
        phone: cleanPhone,
        service,
        date,
        timeSlot,
        fee: estimatedFee
      });
      // Clear fields
      setPatientName('');
      setPhone('');
      setProblemDescription('');
    } else {
      setErrorMessage('Failed to submit appointment. Please check connection and try again.');
    }
  };

  return (
    <section id="book" className="py-16 sm:py-24 bg-white relative scroll-mt-10">
      <div id="booking" className="-top-20 relative pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Instant Online Appointments
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Book Your Dental Appointment
          </h2>
          <p className="text-base text-slate-600">
            Select your preferred time slot and service. Our staff receives your booking immediately. 
            No advance fee required — <strong className="text-blue-900 font-semibold">Pay at Clinic (Cash)</strong>.
          </p>
        </div>

        {/* Content Box */}
        <div className="max-w-4xl mx-auto">
          {submittedBooking ? (
            /* Confirmation card */
            <div className="p-8 sm:p-10 bg-gradient-to-br from-blue-50 via-sky-50 to-white rounded-3xl border border-blue-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                  Booking Confirmed • Status: New
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  We Have Received Your Appointment!
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Our clinic reception team has been notified. We will keep your slot reserved.
                </p>
              </div>

              {/* Summary Card */}
              <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-slate-200 text-left space-y-3 shadow-xs">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-bold text-slate-900">{submittedBooking.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mobile Phone:</span>
                  <span className="font-bold text-slate-900">+91 {submittedBooking.phone}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Dental Service:</span>
                  <span className="font-bold text-blue-800">{submittedBooking.service}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-bold text-slate-900">{submittedBooking.date} at {submittedBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Pay at Clinic (Cash) • ₹{submittedBooking.fee}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href={`https://wa.me/${(settings?.whatsappNumber || '917692808120').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello Dr. Anujay Clinic, I just booked an appointment for ${submittedBooking.service} on ${submittedBooking.date} at ${submittedBooking.timeSlot} under name ${submittedBooking.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Notify via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSubmittedBooking(null)}
                  className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl transition"
                >
                  Book Another Appointment
                </button>
              </div>

            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="bg-slate-50 rounded-3xl p-4 sm:p-8 md:p-10 border border-slate-200/90 shadow-xl space-y-6">
              
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Patient Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Contact Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="text-xs font-bold text-slate-500 mr-1">+91</span>
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full pl-16 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Service Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Select Dental Service *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
                    >
                      {services.map((s, idx) => (
                        <option key={s.id ? `${s.id}-${idx}` : `srv-${idx}`} value={s.name}>
                          {s.name} ({s.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Appointment Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().slice(0, 10)}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Preferred Time Slot * (Clinic Open 9 AM - 8 PM)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition border cursor-pointer ${
                        timeSlot === slot 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms / Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Describe Problem / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="e.g. Tooth ache since 2 days, sensitivity to cold water, routine checkup..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Cash Policy Callout */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Transparent Cash Policy: Pay at Clinic Only</p>
                  <p className="text-blue-800 mt-0.5">
                    Estimated service fee: <span className="font-bold text-blue-950">₹ {estimatedFee}</span>. No advance payment is charged online. Pay in cash or UPI at the clinic reception desk after your treatment.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.01] cursor-pointer"
              >
                {isSubmitting ? 'Sending Booking to Clinic...' : 'Confirm Appointment Now'}
                <CheckCircle2 className="w-4 h-4" />
              </button>

            </form>
          )}
        </div>

      </div>
    </section>
  );
};
