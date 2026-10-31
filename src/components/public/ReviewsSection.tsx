import React, { useState, useRef, useMemo } from 'react';
import { 
  Star, 
  MessageSquarePlus, 
  CheckCircle2, 
  User, 
  Quote, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export const ReviewsSection: React.FC = () => {
  const { reviews, addReview } = useClinic();
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Deduplicate reviews by ID and by author+content to prevent any duplicate display
  const approvedReviews = useMemo(() => {
    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();
    return reviews.filter(r => {
      if (r.isApproved === false) return false;
      if (r.id) {
        if (seenIds.has(r.id)) return false;
        seenIds.add(r.id);
      }
      const sig = `${(r.name || '').trim().toLowerCase()}:::${(r.reviewText || '').trim().toLowerCase()}`;
      if (seenSignatures.has(sig)) return false;
      seenSignatures.add(sig);
      return true;
    });
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    if (!reviewerName.trim() || !reviewText.trim()) {
      setErrorMessage('Please fill in your name and review message.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const ok = await addReview({
        name: reviewerName.trim(),
        rating,
        reviewText: reviewText.trim()
      });

      if (ok) {
        setSuccessMessage(true);
        setReviewerName('');
        setReviewText('');
        setRating(5);
        setTimeout(() => setSuccessMessage(false), 5000);
      } else {
        setErrorMessage('Could not save review. Please check connection and try again.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Patient Testimonials & Google Ratings
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Loved By Thousands of Happy Patients
          </h2>
          <p className="text-base text-slate-600">
            Read real experiences from families who trusted Anujay Dental Clinic for pain-free treatments, 
            or share your own experience below.
          </p>
        </div>

        {/* 2-Column Layout: Reviews Grid (Left/Top) + Add Review Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Reviews List Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Aggregate Stats Card */}
            <div className="p-5 bg-gradient-to-r from-blue-50 to-sky-50 rounded-3xl border border-blue-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-black text-blue-900">4.9</div>
                <div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Overall Satisfaction Score
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-blue-900 bg-white px-3 py-1 rounded-full border border-blue-200">
                  {approvedReviews.length} Verified Reviews
                </span>
              </div>
            </div>

            {/* Reviews Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedReviews.map((rev, idx) => (
                <div 
                  key={rev.id ? `${rev.id}-${idx}` : `rev-${idx}`}
                  className="p-5 bg-slate-50 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Stars + Quote */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                          />
                        ))}
                      </div>
                      <Quote className="w-5 h-5 text-slate-300 shrink-0" />
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{rev.reviewText}"
                    </p>
                  </div>

                  {/* Reviewer signature */}
                  <div className="pt-4 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs uppercase">
                        {rev.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{rev.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Add Review Form Column (Right) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <MessageSquarePlus className="w-4 h-4" />
                <span>Leave Your Feedback</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Share Your Clinic Experience
              </h3>
              <p className="text-xs text-slate-500">
                Any patient can submit their rating and testimonial. It immediately saves to our official records.
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-900 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold">Thank you for your review!</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Your review has been saved to Firestore reviews collection.</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Rating *
                </label>
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            (hoverRating || rating) >= star 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-slate-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating === 5 ? '5.0 - Excellent' : `${rating}.0 Stars`}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Review / Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the doctor's care, clinic cleanliness, treatment outcome..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
              >
                {isSubmitting ? 'Submitting to Firestore...' : 'Post My Review'}
                <MessageSquarePlus className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
};
