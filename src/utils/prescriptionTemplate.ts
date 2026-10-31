/**
 * Authoritative Prescription Template Configuration & Universal Rendering Source
 * for AnuJay Dental Clinic.
 * This provides the exact visual template matching the approved original prescription image,
 * ensuring 100% pixel-perfect fidelity between the on-screen preview and the downloaded PDF.
 * ONLY THREE EDITABLE PRESCRIPTION FIELDS:
 * 1. Patient Name
 * 2. Date
 * 3. Age / Sex
 * Phone number is STRICTLY excluded from the printable letterhead and PDF.
 */

export interface FieldCoordinates {
  // CSS percentage positioning for responsive on-screen preview
  css: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
  // Exact millimeter positioning for A4 jsPDF vector overlay (210mm x 297mm)
  pdf: {
    x: number;
    y: number;
    maxWidth: number;
    fontSize: number;
  };
}

export const PRESCRIPTION_COORDINATES: Record<'patientName' | 'date' | 'ageSex', FieldCoordinates> = {
  patientName: {
    css: {
      top: '12.8%',
      left: '11.0%',
      width: '55.0%',
      height: '2.5%'
    },
    pdf: {
      x: 23.0,
      y: 44.8,
      maxWidth: 114.0,
      fontSize: 10.5
    }
  },
  date: {
    css: {
      top: '12.8%',
      left: '75.2%',
      width: '21.0%',
      height: '2.5%'
    },
    pdf: {
      x: 157.5,
      y: 44.8,
      maxWidth: 43.0,
      fontSize: 9.5
    }
  },
  ageSex: {
    css: {
      top: '15.3%',
      left: '78.8%',
      width: '17.2%',
      height: '2.5%'
    },
    pdf: {
      x: 165.5,
      y: 52.2,
      maxWidth: 35.0,
      fontSize: 9.5
    }
  }
};

export interface BuildSvgOptions {
  customBannerUrl?: string | null;
  doctorPreset?: 'anup_hota' | 'anujay_sharma';
}

/**
 * Built-in high-resolution master SVG prescription template.
 * Matches 100% of the approved authentic AnuJay Dental Clinic letterhead.
 * Supports replacing the top header banner image or toggling doctor presets.
 */
export function buildDefaultPrescriptionSvg(options?: BuildSvgOptions): string {
  const customBanner = options?.customBannerUrl ?? getActivePrescriptionBanner();
  // Permanent doctor preset: Dr. Anup Kumar Hota
  const doctorName = 'Dr. Anup Kumar Hota';
  const doctorDegree = 'DENTAL SURGEON (BDS)';
  const doctorReg = 'REG. NO. : CGDC/G/26/4876';

  const bannerMarkup = customBanner && customBanner.trim().length > 0
    ? `<!-- ================= 1. REPLACED CUSTOM HEADER BANNER ================= -->
  <image href="${customBanner.replace(/"/g, '&quot;')}" x="0" y="0" width="1000" height="172" preserveAspectRatio="none"/>
  <line x1="0" y1="172" x2="1000" y2="172" stroke="#00205b" stroke-width="3"/>`
    : `<!-- ================= 1. PERMANENT OFFICIAL HEADER BANNER ================= -->
  <!-- Left Navy Curved Banner with Golden Arc -->
  <path d="M 0 0 L 265 0 C 310 45, 290 110, 230 162 L 0 162 Z" fill="#00205b"/>
  <path d="M 265 0 C 310 45, 290 110, 230 162" fill="none" stroke="#e5a93c" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Logo inside Banner -->
  <use href="#molarLogo" x="20" y="16" transform="scale(0.85)"/>
  <text x="140" y="58" font-family="'Segoe UI', Arial, sans-serif" font-weight="900" font-size="28" fill="white" letter-spacing="1">ANUJAY</text>
  <text x="140" y="84" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" font-size="13" fill="#38bdf8" letter-spacing="1.8">— DENTAL CLINIC —</text>
  <text x="140" y="108" font-family="'Times New Roman', serif" font-style="italic" font-size="10.5" fill="#facc15">Unique by Nature, Unbeatable in Care</text>

  <!-- Center Doctor Details -->
  <text x="525" y="44" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="900" font-size="27" fill="#00205b">${doctorName}</text>
  <text x="525" y="69" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" font-size="14.5" fill="#1d4ed8">${doctorDegree}</text>
  
  <!-- Reg. No. Pill -->
  <rect x="365" y="82" width="320" height="25" rx="12.5" fill="#003882"/>
  <text x="525" y="99" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="11.5" fill="white" letter-spacing="0.8">${doctorReg}</text>

  <!-- 4 Feature Badges with Icons -->
  <g transform="translate(325, 120)">
    <!-- Badge 1: Expert Care -->
    <circle cx="28" cy="11" r="10" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
    <path d="M 23 11 Q 28 16 33 11" fill="none" stroke="#00205b" stroke-width="1.4" stroke-linecap="round"/>
    <text x="28" y="30" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">EXPERT CARE</text>

    <!-- Divider 1 -->
    <line x1="72" y1="5" x2="72" y2="30" stroke="#cbd5e1" stroke-width="1"/>

    <!-- Badge 2: Advanced Treatment -->
    <circle cx="116" cy="11" r="10" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
    <path d="M 112 11 L 115 14 L 121 8" fill="none" stroke="#00205b" stroke-width="1.4" stroke-linecap="round"/>
    <text x="116" y="27" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">ADVANCED</text>
    <text x="116" y="35" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">TREATMENT</text>

    <!-- Divider 2 -->
    <line x1="160" y1="5" x2="160" y2="30" stroke="#cbd5e1" stroke-width="1"/>

    <!-- Badge 3: Patient First -->
    <circle cx="204" cy="11" r="10" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
    <circle cx="204" cy="8" r="3" fill="#00205b"/>
    <path d="M 199 17 Q 204 13 209 17" fill="none" stroke="#00205b" stroke-width="1.2"/>
    <text x="204" y="30" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">PATIENT FIRST</text>

    <!-- Divider 3 -->
    <line x1="248" y1="5" x2="248" y2="30" stroke="#cbd5e1" stroke-width="1"/>

    <!-- Badge 4: Healthy Smile -->
    <circle cx="292" cy="11" r="10" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
    <circle cx="288" cy="9" r="1.2" fill="#00205b"/>
    <circle cx="296" cy="9" r="1.2" fill="#00205b"/>
    <path d="M 287 13 Q 292 17 297 13" fill="none" stroke="#00205b" stroke-width="1.3" stroke-linecap="round"/>
    <text x="292" y="27" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">HEALTHY SMILE</text>
    <text x="292" y="35" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">EVERY TIME</text>
  </g>

  <!-- Right Navy Timing Box -->
  <rect x="795" y="14" width="190" height="138" rx="12" fill="#00205b"/>
  <circle cx="845" cy="40" r="7" fill="none" stroke="white" stroke-width="1.5"/>
  <path d="M 845 36 L 845 40 L 849 42" fill="none" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <text x="895" y="44" text-anchor="middle" font-size="12" font-weight="900" fill="white" letter-spacing="1">TIMING</text>
  <text x="890" y="70" text-anchor="middle" font-size="14.5" font-weight="900" fill="white">9:00 AM TO 9:00 PM</text>
  <text x="890" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="#7dd3fc">MONDAY TO SUNDAY</text>
  <line x1="815" y1="102" x2="970" y2="102" stroke="#1d4ed8" stroke-width="1.2"/>
  <text x="890" y="122" text-anchor="middle" font-size="10.5" font-weight="900" font-style="italic" fill="white" letter-spacing="0.5">“ YOUR SMILE OUR PRIORITY ”</text>

  <!-- Thick Navy Horizontal Divider -->
  <line x1="0" y1="168" x2="1000" y2="168" stroke="#00205b" stroke-width="3"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1414" width="1000" height="1414" style="background:white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Tooth Monogram Def -->
    <g id="molarLogo">
      <path d="M50 8 C30 8, 12 24, 12 50 C12 72, 22 92, 33 110 C37 116, 42 116, 46 110 C50 116, 55 116, 59 110 C70 92, 80 72, 80 50 C80 24, 62 8, 44 8 Z" fill="none" stroke="white" stroke-width="4.5" stroke-linejoin="round"/>
      <text x="46" y="66" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-style="italic" font-size="44" fill="white">Aj</text>
    </g>
  </defs>

  ${bannerMarkup}

  <!-- ================= 2. PATIENT DEMOGRAPHICS ================= -->
  <!-- Name field line -->
  <text x="35" y="212" font-size="18" font-weight="900" fill="#0f172a">Name :</text>
  <line x1="105" y1="216" x2="665" y2="216" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Date field line -->
  <text x="696" y="212" font-size="17" font-weight="900" fill="#0f172a">Date :</text>
  <line x1="748" y1="216" x2="965" y2="216" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Age / Sex field line -->
  <text x="696" y="248" font-size="17" font-weight="900" fill="#0f172a">Age / Sex :</text>
  <line x1="785" y1="252" x2="965" y2="252" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Divider below demographics -->
  <line x1="20" y1="268" x2="980" y2="268" stroke="#cbd5e1" stroke-width="1"/>

  <!-- ================= 3. BODY (3 COLUMNS) ================= -->
  <!-- Vertical Divider 1: between Col 1 and Col 2 -->
  <line x1="162" y1="268" x2="162" y2="1080" stroke="#00205b" stroke-width="2"/>
  <!-- Vertical Divider 2: between Col 2 and Col 3 -->
  <line x1="775" y1="268" x2="775" y2="1080" stroke="#00205b" stroke-width="2"/>

  <!-- COLUMN 1: Rx, C/C, PMH, TREATMENT ADVISED -->
  <!-- Rx Symbol -->
  <text x="45" y="336" font-family="'Times New Roman', serif" font-weight="bold" font-style="italic" font-size="64" fill="#00205b">℞</text>

  <!-- C / C -->
  <text x="32" y="395" font-size="18" font-weight="900" fill="#00205b" letter-spacing="0.5">C / C</text>
  <line x1="32" y1="428" x2="148" y2="428" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,3"/>
  <line x1="32" y1="462" x2="148" y2="462" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,3"/>

  <!-- Divider between C/C and PMH -->
  <line x1="22" y1="508" x2="158" y2="508" stroke="#00205b" stroke-width="1.8"/>

  <!-- PMH -->
  <text x="32" y="555" font-size="18" font-weight="900" fill="#00205b" letter-spacing="0.5">PMH</text>
  <line x1="32" y1="592" x2="148" y2="592" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,3"/>
  <line x1="32" y1="626" x2="148" y2="626" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,3"/>

  <!-- Open Blank Handwriting Space between PMH and Treatment Advised -->

  <!-- Divider above Treatment Advised (at bottom of Col 1) -->
  <line x1="22" y1="925" x2="158" y2="925" stroke="#00205b" stroke-width="1.8"/>

  <!-- TREATMENT ADVISED : -->
  <text x="32" y="965" font-size="14.5" font-weight="900" fill="#00205b">TREATMENT</text>
  <text x="32" y="988" font-size="14.5" font-weight="900" fill="#00205b">ADVISED :</text>
  <line x1="32" y1="1022" x2="148" y2="1022" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,3"/>
  <line x1="32" y1="1052" x2="148" y2="1052" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,3"/>

  <!-- COLUMN 2: O / E & Clean Blank Handwriting Pad (NO dotted lines, clean writing area) -->
  <text x="185" y="315" font-size="18" font-weight="900" fill="#00205b" letter-spacing="0.5">O / E</text>

  <!-- COLUMN 3: OUR SERVICES Pill & 10 Services -->
  <rect x="795" y="285" width="165" height="28" rx="14" fill="#00205b"/>
  <text x="877" y="304" text-anchor="middle" font-size="12" font-weight="900" fill="white" letter-spacing="1">OUR SERVICES</text>

  <!-- 10 Dental Services with clean outlined icons -->
  <g font-size="11.5" font-weight="bold" fill="#1e293b" transform="translate(790, 340)">
    <!-- 1 -->
    <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
    <path d="M 7 5 Q 12 2 17 5 Q 19 12 16 19 L 12 17 L 8 19 Q 5 12 7 5 Z" fill="none" stroke="#00205b" stroke-width="1.2"/>
    <text x="32" y="12" font-size="11">Dental Check-up &amp;</text>
    <text x="32" y="24" font-size="11">Consultation</text>

    <!-- 2 -->
    <g transform="translate(0, 48)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 6 6 Q 12 3 18 6 Q 18 14 15 20 Q 12 17 9 20 Q 6 14 6 6 Z" fill="none" stroke="#00205b" stroke-width="1.2"/>
      <path d="M 12 6 L 12 16" stroke="#00205b" stroke-width="1.2"/>
      <text x="32" y="11" font-size="11">Root Canal</text>
      <text x="32" y="23" font-size="11">Treatment (RCT)</text>
    </g>

    <!-- 3 -->
    <g transform="translate(0, 96)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 5 18 L 4 7 L 8 11 L 12 5 L 16 11 L 20 7 L 19 18 Z" fill="none" stroke="#00205b" stroke-width="1.2"/>
      <text x="32" y="11" font-size="11">Crown &amp; Bridge</text>
      <text x="32" y="23" font-size="11">Treatment</text>
    </g>

    <!-- 4 -->
    <g transform="translate(0, 144)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 6 5 L 18 5 M 8 9 L 16 9 M 10 13 L 14 13 M 11 17 L 13 17 M 12 17 L 12 21" stroke="#00205b" stroke-width="1.3" stroke-linecap="round"/>
      <text x="32" y="16" font-size="11">Dental Implants</text>
    </g>

    <!-- 5 -->
    <g transform="translate(0, 192)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 8 12 Q 12 8 16 12 Q 12 16 8 12 Z M 12 6 L 12 18 M 6 12 L 18 12" stroke="#00205b" stroke-width="1.2"/>
      <text x="32" y="11" font-size="11">Teeth Cleaning</text>
      <text x="32" y="23" font-size="11">&amp; Scaling</text>
    </g>

    <!-- 6 -->
    <g transform="translate(0, 240)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 6 4 L 10 13 L 7 21 L 17 11 L 13 11 L 17 4 Z" fill="#00205b"/>
      <text x="32" y="11" font-size="11">Tooth Extraction</text>
      <text x="32" y="23" font-size="11">(Surgical &amp; Normal)</text>
    </g>

    <!-- 7 -->
    <g transform="translate(0, 288)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <rect x="3" y="9" width="4" height="6" fill="#00205b"/>
      <rect x="10" y="9" width="4" height="6" fill="#00205b"/>
      <rect x="17" y="9" width="4" height="6" fill="#00205b"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="#00205b" stroke-width="1.2"/>
      <text x="32" y="11" font-size="11">Orthodontic</text>
      <text x="32" y="23" font-size="11">Treatment</text>
    </g>

    <!-- 8 -->
    <g transform="translate(0, 336)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 12 4 L 14 9 L 19 10 L 15 14 L 16 19 L 12 16 L 8 19 L 9 14 L 5 10 L 10 9 Z" fill="#f59e0b"/>
      <text x="32" y="11" font-size="11">Cosmetic Dentistry</text>
      <text x="32" y="23" font-size="10.5">(Whitening, Smile Design)</text>
    </g>

    <!-- 9 -->
    <g transform="translate(0, 384)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <circle cx="9" cy="9" r="1.5" fill="#00205b"/>
      <circle cx="15" cy="9" r="1.5" fill="#00205b"/>
      <path d="M 7 14 Q 12 18 17 14" fill="none" stroke="#00205b" stroke-width="1.4" stroke-linecap="round"/>
      <text x="32" y="11" font-size="11">Pediatric Dentistry</text>
      <text x="32" y="23" font-size="11">(Child Care)</text>
    </g>

    <!-- 10 -->
    <g transform="translate(0, 432)">
      <rect x="0" y="0" width="24" height="24" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
      <path d="M 12 4 L 19 7 L 19 13 Q 19 18 12 21 Q 5 18 5 13 L 5 7 Z" fill="none" stroke="#00205b" stroke-width="1.3"/>
      <text x="32" y="11" font-size="11">Preventive Dentistry</text>
      <text x="32" y="23" font-size="11">&amp; Oral Care</text>
    </g>
  </g>

  <!-- Motto at bottom of Column 3 -->
  <text x="877" y="1035" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-style="italic" font-size="18" fill="#00205b">Because You</text>
  <text x="877" y="1058" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-style="italic" font-size="18" fill="#00205b">Deserve the Best</text>

  <!-- ================= 4. PATIENT DECLARATION ================= -->
  <!-- Solid Blue Divider -->
  <line x1="20" y1="1080" x2="980" y2="1080" stroke="#00205b" stroke-width="2.5"/>

  <!-- Declaration Heading with Diamond Dots -->
  <line x1="230" y1="1098" x2="270" y2="1098" stroke="#00205b" stroke-width="1.5"/>
  <circle cx="277" cy="1098" r="3" fill="#00205b"/>
  <text x="490" y="1103" text-anchor="middle" font-size="14.5" font-weight="900" fill="#00205b" letter-spacing="1">PATIENT DECLARATION (मरीज की घोषणा)</text>
  <circle cx="703" cy="1098" r="3" fill="#00205b"/>
  <line x1="710" y1="1098" x2="750" y2="1098" stroke="#00205b" stroke-width="1.5"/>

  <!-- Left Side: Bilingual Declaration Text -->
  <g font-size="10.8" fill="#334155" transform="translate(42, 1128)">
    <text x="0" y="0">I, __________________________________, have been explained my dental condition,</text>
    <text x="0" y="16">treatment plan, risks, benefits and alternatives.</text>
    <text x="0" y="40" fill="#475569">मैं, __________________________________, को मेरी दंत स्थिति, उपचार योजना,</text>
    <text x="0" y="56" fill="#475569">जोखिम और लाभ समझा दिए गए हैं।</text>
    <text x="0" y="80">I understand that outcomes may vary and procedures may be adjusted as required.</text>
    <text x="0" y="96" fill="#475569">मैं समझता/समझती हूँ कि परिणाम भिन्न हो सकते हैं।</text>
    <text x="0" y="120">I voluntarily consent to the proposed treatment.</text>
    <text x="0" y="136" fill="#475569">मैं स्वेच्छा से प्रस्तावित उपचार की सहमति देता/देती हूँ।</text>
  </g>

  <!-- Right Side: Patient Signature Line with Fountain Pen -->
  <g transform="translate(760, 1140)">
    <!-- Fountain Pen Icon -->
    <path d="M 90 60 L 68 82 L 72 86 L 94 64 Z M 66 84 L 62 93 L 71 89 Z" fill="#00205b"/>
    <!-- Signature Line -->
    <line x1="10" y1="120" x2="190" y2="120" stroke="#0f172a" stroke-width="1.3"/>
    <text x="100" y="138" text-anchor="middle" font-size="13.5" font-weight="900" fill="#0f172a">Patient Signature</text>
    <text x="100" y="154" text-anchor="middle" font-size="12" font-weight="bold" fill="#475569">मरीज के हस्ताक्षर</text>
  </g>

  <!-- ================= 5. FOOTER SECTION ================= -->
  <!-- Top Footer Line -->
  <line x1="20" y1="1302" x2="980" y2="1302" stroke="#00205b" stroke-width="3"/>

  <!-- Footer 4 Columns -->
  <!-- Col 1: Address -->
  <g transform="translate(30, 1332)">
    <circle cx="10" cy="10" r="8" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="10" cy="9" r="2.5" fill="#1d4ed8"/>
    <text x="26" y="8" font-size="11.5" font-weight="900" fill="#0f172a">Shop no. 3, infront of Utsav Bhavan,</text>
    <text x="26" y="24" font-size="11" font-weight="500" fill="#475569">Sunder Nagar, Bhilai,</text>
    <text x="26" y="40" font-size="11" font-weight="500" fill="#475569">Chhattisgarh (490026).</text>
  </g>

  <!-- Col 2: Phone, Email, Web -->
  <g transform="translate(360, 1332)">
    <!-- Phone -->
    <text x="32" y="10" font-size="14.5" font-weight="900" fill="#00205b">88394 75969</text>
    <!-- Email -->
    <text x="32" y="28" font-size="11" font-weight="500" fill="#475569">anujaydentalclinic@gmail.com</text>
    <!-- Web -->
    <text x="32" y="44" font-size="11" font-weight="500" fill="#475569">www.anujaydentalclinic.com</text>
  </g>

  <!-- Divider between Col 2 and Col 3 -->
  <line x1="620" y1="1312" x2="620" y2="1395" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Col 3: QR Code Directions -->
  <g transform="translate(645, 1324)">
    <text x="44" y="0" text-anchor="middle" font-size="9.5" font-weight="900" fill="#0f172a" letter-spacing="0.5">SCAN FOR DIRECTIONS</text>
    <!-- High-res QR graphic -->
    <rect x="14" y="8" width="60" height="60" fill="white" stroke="#94a3b8" stroke-width="1"/>
    <!-- Standard QR corners -->
    <rect x="20" y="14" width="16" height="16" fill="#00205b"/>
    <rect x="23" y="17" width="10" height="10" fill="white"/>
    <rect x="25" y="19" width="6" height="6" fill="#00205b"/>
    <rect x="52" y="14" width="16" height="16" fill="#00205b"/>
    <rect x="55" y="17" width="10" height="10" fill="white"/>
    <rect x="57" y="19" width="6" height="6" fill="#00205b"/>
    <rect x="20" y="46" width="16" height="16" fill="#00205b"/>
    <rect x="23" y="49" width="10" height="10" fill="white"/>
    <rect x="25" y="51" width="6" height="6" fill="#00205b"/>
    <!-- Pattern dots -->
    <rect x="40" y="22" width="6" height="6" fill="#00205b"/>
    <rect x="42" y="34" width="8" height="6" fill="#00205b"/>
    <rect x="54" y="42" width="12" height="6" fill="#00205b"/>
    <rect x="40" y="52" width="8" height="8" fill="#00205b"/>
  </g>

  <!-- Divider between Col 3 and Col 4 -->
  <line x1="775" y1="1312" x2="775" y2="1395" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Col 4: Follow Us -->
  <g transform="translate(805, 1332)">
    <text x="75" y="2" text-anchor="middle" font-size="9.5" font-weight="900" fill="#0f172a" letter-spacing="0.5">FOLLOW US</text>
    
    <!-- FB icon -->
    <circle cx="58" cy="22" r="10" fill="#1877f2"/>
    <path d="M 60 16 L 58 16 C 56 16 55 17 55 19 L 55 21 L 53 21 L 53 23 L 55 23 L 55 28 L 57 28 L 57 23 L 59 23 L 60 21 L 57 21 L 57 19.5 C 57 19 57.5 18.5 58 18.5 L 60 18.5 Z" fill="white"/>

    <!-- Insta icon -->
    <rect x="78" y="12" width="20" height="20" rx="5" fill="#e1306c"/>
    <circle cx="88" cy="22" r="4.5" fill="none" stroke="white" stroke-width="1.5"/>
    <circle cx="93" cy="17" r="1" fill="white"/>

    <text x="75" y="46" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#334155">anujaydentalclinic</text>
  </g>
</svg>`;
}

export function getDefaultTemplateDataUrl(options?: BuildSvgOptions): string {
  const svg = buildDefaultPrescriptionSvg(options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Retrieves the custom prescription banner image data URL if one has been uploaded or configured.
 */
export function getActivePrescriptionBanner(customUrl?: string | null): string | null {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl;
  }
  try {
    const local = localStorage.getItem('anujay_custom_prescription_banner');
    if (local && local.trim().length > 0) {
      return local;
    }
  } catch (err) {
    console.warn('Could not read custom banner from localStorage:', err);
  }
  return null;
}

/**
 * Stores a newly uploaded or replaced prescription banner image.
 */
export function saveActivePrescriptionBanner(dataUrl: string): void {
  try {
    localStorage.setItem('anujay_custom_prescription_banner', dataUrl);
    window.dispatchEvent(new Event('prescription_template_changed'));
  } catch (err) {
    console.warn('Could not save custom banner to localStorage:', err);
  }
}

/**
 * Resets the prescription banner back to default.
 */
export function resetActivePrescriptionBanner(): void {
  try {
    localStorage.removeItem('anujay_custom_prescription_banner');
    window.dispatchEvent(new Event('prescription_template_changed'));
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Doctor letterhead preset:
 * - 'anup_hota': Dr. Anup Kumar Hota (Official Letterhead)
 * - 'anujay_sharma': Dr. Anujay Sharma (Chief Surgeon)
 */
export function getPrescriptionDoctorPreset(): 'anup_hota' | 'anujay_sharma' {
  try {
    const preset = localStorage.getItem('anujay_prescription_doctor_preset');
    if (preset === 'anujay_sharma') return 'anujay_sharma';
  } catch (err) {
    console.warn(err);
  }
  return 'anup_hota';
}

export function setPrescriptionDoctorPreset(preset: 'anup_hota' | 'anujay_sharma'): void {
  try {
    localStorage.setItem('anujay_prescription_doctor_preset', preset);
    window.dispatchEvent(new Event('prescription_template_changed'));
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Retrieves the current active prescription template image:
 * Prioritizes:
 * 1. User-uploaded custom whole-image scan in localStorage ('anujay_custom_prescription_template')
 * 2. Clinic settings template if configured
 * 3. Default authentic SVG template data URL (with custom banner embedded if active)
 */
export function getActivePrescriptionTemplate(
  customUrl?: string | null,
  customBannerUrl?: string | null
): string {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl;
  }
  try {
    const local = localStorage.getItem('anujay_custom_prescription_template');
    if (local && local.trim().length > 0) {
      return local;
    }
  } catch (err) {
    console.warn('Could not read custom template from localStorage:', err);
  }
  return getDefaultTemplateDataUrl({ customBannerUrl });
}

/**
 * Stores a newly uploaded prescription template scan.
 */
export function saveActivePrescriptionTemplate(dataUrl: string): void {
  try {
    localStorage.setItem('anujay_custom_prescription_template', dataUrl);
    window.dispatchEvent(new Event('prescription_template_changed'));
  } catch (err) {
    console.warn('Could not save custom template to localStorage:', err);
  }
}

/**
 * Resets back to default authentic template.
 */
export function resetActivePrescriptionTemplate(): void {
  try {
    localStorage.removeItem('anujay_custom_prescription_template');
    window.dispatchEvent(new Event('prescription_template_changed'));
  } catch (err) {
    console.warn(err);
  }
}
