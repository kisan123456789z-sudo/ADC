import React from 'react';
import { 
  CheckCheck, 
  ExternalLink, 
  Phone, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  Image as ImageIcon,
  Smile,
  Paperclip,
  Mic,
  Camera
} from 'lucide-react';
import { CampaignType } from '../../../types/clinic';

interface WhatsAppLivePreviewProps {
  title: string;
  type: CampaignType;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaCaption?: string;
  ctaText?: string;
  ctaUrl?: string;
  offerDetails?: {
    discountText?: string;
    couponCode?: string;
    expiryDate?: string;
  };
  clinicName?: string;
}

/**
 * Parses basic WhatsApp text markdown:
 * *bold* -> <strong>
 * _italic_ -> <em>
 * ~strikethrough~ -> <del>
 * ```code``` -> <code>
 */
function parseWhatsAppMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Process markdown formatting inside line
    let formatted: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Regex for bold (*...*), italic (_..._), strikethrough (~...~), monospace (```...```)
    const regex = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~|```([^`]+)```)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        formatted.push(line.substring(lastIndex, match.index));
      }

      if (match[2]) {
        // Bold: *text*
        formatted.push(<strong key={`b-${lineIdx}-${keyIdx++}`} className="font-bold text-slate-900">{match[2]}</strong>);
      } else if (match[3]) {
        // Italic: _text_
        formatted.push(<em key={`i-${lineIdx}-${keyIdx++}`} className="italic">{match[3]}</em>);
      } else if (match[4]) {
        // Strikethrough: ~text~
        formatted.push(<del key={`s-${lineIdx}-${keyIdx++}`} className="line-through opacity-75">{match[4]}</del>);
      } else if (match[5]) {
        // Monospace: ```text```
        formatted.push(<code key={`c-${lineIdx}-${keyIdx++}`} className="font-mono text-xs bg-black/10 px-1 py-0.5 rounded">{match[5]}</code>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      formatted.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {formatted.length > 0 ? formatted : <span>&nbsp;</span>}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const WhatsAppLivePreview: React.FC<WhatsAppLivePreviewProps> = ({
  title,
  type,
  content,
  mediaUrl,
  mediaType = 'image',
  mediaCaption,
  ctaText,
  ctaUrl,
  offerDetails,
  clinicName = "Dr. Anujay's Dental Clinic"
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full max-w-[340px] mx-auto bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700 select-none">
      
      {/* Phone Camera Notch & Speaker */}
      <div className="relative flex justify-center items-center pb-2 pt-1">
        <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-800"></div>
          <div className="w-8 h-1 rounded-full bg-slate-800"></div>
        </div>
      </div>

      {/* Screen Frame */}
      <div className="bg-[#efeae2] rounded-[30px] overflow-hidden flex flex-col h-[560px] text-slate-800 relative shadow-inner">
        
        {/* WhatsApp Top App Bar */}
        <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#075e54] flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-white/40">
              🦷
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs leading-none max-w-[150px] truncate text-white">
                  {clinicName}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] text-emerald-100/90 leading-tight block">
                Official Business Account
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-200">
            {currentTime}
          </div>
        </div>

        {/* Chat Conversation Body (WhatsApp Wallpaper Texture) */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 flex flex-col justify-end bg-gradient-to-b from-[#e5ddd5]/60 to-[#efeae2]">
          
          {/* Security & Encryption Notice */}
          <div className="bg-amber-100/80 border border-amber-200 text-amber-900 text-[9px] rounded-lg p-1.5 text-center leading-tight shadow-2xs mx-2">
            🔒 Messages to this chat are secured with end-to-end encryption.
          </div>

          {/* Today Date Divider */}
          <div className="text-center">
            <span className="bg-white/80 backdrop-blur-xs text-slate-600 text-[10px] px-2.5 py-0.5 rounded-md shadow-2xs font-medium">
              Today
            </span>
          </div>

          {/* Outgoing Message Bubble (Received by patient from clinic) */}
          <div className="max-w-[92%] bg-white rounded-2xl rounded-tl-xs p-2.5 shadow-sm space-y-2 border border-slate-200/60 relative animate-in fade-in">
            
            {/* Media Attachment (Image / Video) */}
            {(type === 'image' || type === 'offer' || type === 'notice') && mediaUrl && (
              <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video w-full border border-slate-200/80">
                <img 
                  src={mediaUrl} 
                  alt="Campaign media" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {type === 'video' && mediaUrl && (
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video w-full flex items-center justify-center text-white">
                <div className="w-12 h-12 rounded-full bg-black/60 border border-white/40 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
                <span className="absolute bottom-1.5 right-2 text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white">
                  0:45 • Video
                </span>
              </div>
            )}

            {/* Special Offer Highlight Banner */}
            {type === 'offer' && offerDetails?.discountText && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-2 rounded-xl text-xs space-y-0.5 shadow-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Special Clinic Privilege</span>
                </div>
                <div className="font-extrabold text-xs">{offerDetails.discountText}</div>
                {offerDetails.couponCode && (
                  <div className="inline-block bg-white/20 border border-white/40 text-[10px] font-mono px-2 py-0.5 rounded mt-0.5">
                    Code: <strong>{offerDetails.couponCode}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Message Body Content */}
            <div className="text-[11px] leading-relaxed text-slate-800 break-words">
              {content ? (
                parseWhatsAppMarkdown(content)
              ) : (
                <span className="text-slate-400 italic">
                  Start typing in the composer to preview your WhatsApp message...
                </span>
              )}
            </div>

            {/* Call to Action Interactive Buttons (WhatsApp Interactive Template Buttons) */}
            {ctaText && (
              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                <a
                  href={ctaUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.preventDefault()}
                  className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#075e54] text-[11px] font-bold rounded-lg border border-emerald-200/80 flex items-center justify-center gap-1.5 transition text-center"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{ctaText}</span>
                </a>
              </div>
            )}

            {/* Message Timestamp & Blue Double Read Checkmarks */}
            <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-0.5">
              <span>{currentTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            </div>

          </div>

        </div>

        {/* WhatsApp Bottom Simulation Input Bar */}
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-1.5 border-t border-slate-200 shrink-0">
          <Smile className="w-4 h-4 text-slate-500" />
          <Paperclip className="w-4 h-4 text-slate-500" />
          <div className="flex-1 bg-white rounded-full py-1.5 px-3 text-[11px] text-slate-400 border border-slate-200 truncate">
            Type a message...
          </div>
          <Mic className="w-4 h-4 text-slate-500" />
        </div>

      </div>

      {/* Footer live hint */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-slate-400">
          📱 Realistic WhatsApp Client Simulation
        </p>
      </div>

    </div>
  );
};
