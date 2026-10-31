import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  Award, 
  Stethoscope, 
  GraduationCap, 
  Heart, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export const AboutAndFaqSection: React.FC = () => {
  const { about, faqs, settings } = useClinic();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/60 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ================= FAQ (FAQS) SECTION ================= */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              Frequently Asked Questions (FAQ)
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Have Questions? We Have Answers.
            </h2>
            <p className="text-base text-slate-600">
              Clear answers to the most common queries regarding painless root canal, checkups, sterilization, and pricing.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={faq.id ? `${faq.id}-${idx}` : `faq-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-blue-700 transition cursor-pointer"
                  >
                    <span className="text-sm sm:text-base leading-snug">{faq.question}</span>
                    <div className={`p-1.5 rounded-full bg-slate-100 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
