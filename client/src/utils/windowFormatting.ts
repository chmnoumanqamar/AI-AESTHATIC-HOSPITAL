/**
 * Window & Theme Formatting System
 * Provides centralized customization for color themes, typography, window borders,
 * scaling, and canvas tones across the clinical command deck.
 */

export interface ThemeColorOption {
  id: string;
  name: string;
  description: string;
  gradientStart: string;
  gradientEnd: string;
  hoverStart: string;
  hoverEnd: string;
  accent: string;
  accentHover: string;
  badgeBgLight: string;
  badgeTextLight: string;
  badgeBgDark: string;
  badgeTextDark: string;
  dotColor: string;
}

export interface FontFamilyOption {
  id: string;
  name: string;
  cssFamily: string;
  sample: string;
  category: string;
}

export interface FontSizeOption {
  id: string;
  name: string;
  px: number;
  description: string;
}

export interface BorderRadiusOption {
  id: string;
  name: string;
  px: number;
  description: string;
}

export interface SurfaceToneOption {
  id: string;
  name: string;
  bgLight: string;
  bgDark: string;
  description: string;
}

export interface WindowFormattingConfig {
  themeColorId: string;
  fontFamilyId: string;
  fontSizeId: string;
  borderRadiusId: string;
  surfaceToneId: string;
  highContrastBorders: boolean;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  {
    id: 'moss',
    name: 'Moss Olive & Deep Forest',
    description: 'Official Clinical Command Deck signature earth palette',
    gradientStart: '#2D6A4F',
    gradientEnd: '#1B4332',
    hoverStart: '#388463',
    hoverEnd: '#225640',
    accent: '#656D4A',
    accentHover: '#414833',
    badgeBgLight: '#E8EFE9',
    badgeTextLight: '#1B4332',
    badgeBgDark: '#1E2C20',
    badgeTextDark: '#A4D0A4',
    dotColor: '#2D6A4F'
  },
  {
    id: 'bronze',
    name: 'Warm Walnut & Espresso Bronze',
    description: 'Executive clinical suite with warm rich timber tones',
    gradientStart: '#7F4F24',
    gradientEnd: '#582F0E',
    hoverStart: '#936639',
    hoverEnd: '#683710',
    accent: '#936639',
    accentHover: '#7F4F24',
    badgeBgLight: '#FBEFE3',
    badgeTextLight: '#582F0E',
    badgeBgDark: '#301F12',
    badgeTextDark: '#ECC8AF',
    dotColor: '#7F4F24'
  },
  {
    id: 'ocean',
    name: 'Nordic Slate & Clinical Blue',
    description: 'High-tech diagnostic and acute hospital precision',
    gradientStart: '#1D4ED8',
    gradientEnd: '#1E3A8A',
    hoverStart: '#2563EB',
    hoverEnd: '#1E40AF',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    badgeBgLight: '#EFF6FF',
    badgeTextLight: '#1E40AF',
    badgeBgDark: '#172554',
    badgeTextDark: '#93C5FD',
    dotColor: '#2563EB'
  },
  {
    id: 'teal',
    name: 'Teal Marina & Surgical Cyan',
    description: 'Calming pediatric and outpatient sanitary wellness',
    gradientStart: '#0D9488',
    gradientEnd: '#115E59',
    hoverStart: '#14B8A6',
    hoverEnd: '#0F766E',
    accent: '#0D9488',
    accentHover: '#115E59',
    badgeBgLight: '#F0FDFA',
    badgeTextLight: '#115E59',
    badgeBgDark: '#134E4A',
    badgeTextDark: '#5EEAD4',
    dotColor: '#0D9488'
  },
  {
    id: 'amethyst',
    name: 'Amethyst & Royal Plum',
    description: 'Specialty aesthetic clinic & dermatology styling',
    gradientStart: '#6D28D9',
    gradientEnd: '#4C1D95',
    hoverStart: '#7C3AED',
    hoverEnd: '#5B21B6',
    accent: '#7C3AED',
    accentHover: '#6D28D9',
    badgeBgLight: '#FAF5FF',
    badgeTextLight: '#581C87',
    badgeBgDark: '#3B0764',
    badgeTextDark: '#D8B4FE',
    dotColor: '#7C3AED'
  },
  {
    id: 'forest',
    name: 'Deep Forest & Slate Carbon',
    description: 'Minimalist high-contrast botanical deep green',
    gradientStart: '#333D29',
    gradientEnd: '#1C2217',
    hoverStart: '#414833',
    hoverEnd: '#27301F',
    accent: '#414833',
    accentHover: '#333D29',
    badgeBgLight: '#F3F5EE',
    badgeTextLight: '#1C2217',
    badgeBgDark: '#151D12',
    badgeTextDark: '#C2C5AA',
    dotColor: '#333D29'
  }
];

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  {
    id: 'inter',
    name: 'Inter',
    cssFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sample: 'Clinical Telemetry & Vitals 120/80',
    category: 'Clinical Standard'
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    cssFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sample: 'Modern Diagnostic Interface AaBbCc',
    category: 'Modern Geometric'
  },
  {
    id: 'outfit',
    name: 'Outfit',
    cssFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    sample: 'Aesthetic Wellness & Care AaBbCc',
    category: 'Friendly Display'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    cssFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sample: 'Universal High-Legibility Typography',
    category: 'Crisp Neutral'
  },
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    cssFamily: "'JetBrains Mono', monospace",
    sample: 'TOKEN_SYS_IMMUTABLE #84920',
    category: 'Monospace Technical'
  },
  {
    id: 'system',
    name: 'System Default',
    cssFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    sample: 'Native Operating System Sans',
    category: 'System Native'
  }
];

// STRICT ENFORCEMENT: Max font size project-wide is 12px
export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  {
    id: 'compact',
    name: 'Compact Density',
    px: 10,
    description: '10px base: Maximum data density for complex queues & clinical charts'
  },
  {
    id: 'balanced',
    name: 'Balanced Clean',
    px: 11,
    description: '11px base: Balanced typographic hierarchy with comfortable reading'
  },
  {
    id: 'standard',
    name: 'Standard Max (Ceiling)',
    px: 12,
    description: '12px base: Maximum allowable clinical font size (hard project limit)'
  }
];

export const BORDER_RADIUS_OPTIONS: BorderRadiusOption[] = [
  {
    id: 'sharp',
    name: 'Sharp Clinical',
    px: 4,
    description: 'Crisp 4px corners for structured, technical medical precision'
  },
  {
    id: 'modern',
    name: 'Modern Balanced',
    px: 10,
    description: 'Balanced 10px corners for contemporary clinical workflow'
  },
  {
    id: 'soft',
    name: 'Soft Pebble',
    px: 16,
    description: 'Comforting 16px pill-soft curves for gentle patient-facing warmth'
  }
];

export const SURFACE_TONE_OPTIONS: SurfaceToneOption[] = [
  {
    id: 'sage',
    name: 'Sage Cream (Default)',
    bgLight: '#FAFBF7',
    bgDark: '#151D12',
    description: 'Signature soothing organic light herbal undertone'
  },
  {
    id: 'white',
    name: 'Pure White (High Contrast)',
    bgLight: '#FFFFFF',
    bgDark: '#0D110C',
    description: 'Crisp stark white canvas with maximum element separation'
  },
  {
    id: 'linen',
    name: 'Soft Ecru Linen',
    bgLight: '#F5F5ED',
    bgDark: '#181E15',
    description: 'Gentle warm paper tone reducing eye fatigue during long shifts'
  },
  {
    id: 'mist',
    name: 'Cool Hospital Mist',
    bgLight: '#F1F5F9',
    bgDark: '#0F172A',
    description: 'Refined cool slate steel canvas for laboratory feel'
  }
];

export const DEFAULT_FORMATTING_CONFIG: WindowFormattingConfig = {
  themeColorId: 'moss',
  fontFamilyId: 'inter',
  fontSizeId: 'standard', // 12px
  borderRadiusId: 'modern', // 10px
  surfaceToneId: 'sage',
  highContrastBorders: false
};

const STORAGE_KEY = 'hospital_window_formatting';
const STYLE_TAG_ID = 'hospital-custom-formatting-styles';

export function getStoredWindowFormatting(): WindowFormattingConfig {
  if (typeof window === 'undefined') return DEFAULT_FORMATTING_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        themeColorId: parsed.themeColorId || DEFAULT_FORMATTING_CONFIG.themeColorId,
        fontFamilyId: parsed.fontFamilyId || DEFAULT_FORMATTING_CONFIG.fontFamilyId,
        fontSizeId: parsed.fontSizeId || DEFAULT_FORMATTING_CONFIG.fontSizeId,
        borderRadiusId: parsed.borderRadiusId || DEFAULT_FORMATTING_CONFIG.borderRadiusId,
        surfaceToneId: parsed.surfaceToneId || DEFAULT_FORMATTING_CONFIG.surfaceToneId,
        highContrastBorders: Boolean(parsed.highContrastBorders)
      };
    }
  } catch (e) {
    console.error('Failed to parse window formatting configuration:', e);
  }
  return DEFAULT_FORMATTING_CONFIG;
}

export function saveWindowFormatting(config: WindowFormattingConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    applyWindowFormatting(config);
    window.dispatchEvent(new CustomEvent('hospital_formatting_changed', { detail: config }));
  } catch (e) {
    console.error('Failed to save window formatting configuration:', e);
  }
}

export function resetWindowFormatting(): WindowFormattingConfig {
  saveWindowFormatting(DEFAULT_FORMATTING_CONFIG);
  return DEFAULT_FORMATTING_CONFIG;
}

export function applyWindowFormatting(config: WindowFormattingConfig): void {
  if (typeof document === 'undefined') return;

  const color = THEME_COLOR_OPTIONS.find(c => c.id === config.themeColorId) || THEME_COLOR_OPTIONS[0];
  const font = FONT_FAMILY_OPTIONS.find(f => f.id === config.fontFamilyId) || FONT_FAMILY_OPTIONS[0];
  const fontSize = FONT_SIZE_OPTIONS.find(s => s.id === config.fontSizeId) || FONT_SIZE_OPTIONS[2]; // Default to standard (12px)
  const radius = BORDER_RADIUS_OPTIONS.find(r => r.id === config.borderRadiusId) || BORDER_RADIUS_OPTIONS[1]; // Default to modern (10px)
  const surface = SURFACE_TONE_OPTIONS.find(s => s.id === config.surfaceToneId) || SURFACE_TONE_OPTIONS[0];

  const root = document.documentElement;

  // Set CSS Custom Properties
  root.style.setProperty('--app-font-family', font.cssFamily);
  root.style.setProperty('--app-font-size', `${fontSize.px}px`);
  root.style.setProperty('--window-radius', `${radius.px}px`);
  root.style.setProperty('--primary-gradient-start', color.gradientStart);
  root.style.setProperty('--primary-gradient-end', color.gradientEnd);
  root.style.setProperty('--primary-gradient-hover-start', color.hoverStart);
  root.style.setProperty('--primary-gradient-hover-end', color.hoverEnd);
  root.style.setProperty('--primary-accent', color.accent);
  root.style.setProperty('--primary-accent-hover', color.accentHover);
  root.style.setProperty('--window-surface-light', surface.bgLight);
  root.style.setProperty('--window-surface-dark', surface.bgDark);

  // Dynamic style injection to guarantee immediate application across all utility elements
  let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Project-wide custom window formatting */
    *, html, body, #root, input, button, select, textarea, div, p, span, h1, h2, h3, h4, h5, h6, label {
      font-family: ${font.cssFamily} !important;
    }

    html, body {
      font-size: ${fontSize.px}px !important;
    }

    /* Complete Window Canvas Surface Background */
    body, #root, .window-canvas-bg, .bg-\\[\\#F8F9FA\\] {
      background-color: ${surface.bgLight} !important;
    }
    html.dark body, html.dark #root, html.dark .window-canvas-bg, html.dark .dark\\:bg-\\[\\#1A2215\\], html.dark .bg-\\[\\#1A2215\\] {
      background-color: ${surface.bgDark} !important;
    }

    /* Buttons & Interactive Elements across complete window */
    .clinical-button-primary {
      background: linear-gradient(135deg, ${color.gradientStart} 0%, ${color.gradientEnd} 100%) !important;
      border-radius: ${radius.px}px !important;
      box-shadow: 0 2px 6px ${color.gradientStart}40, 0 1px 2px rgba(0,0,0,0.05) !important;
    }

    .clinical-button-primary:hover {
      background: linear-gradient(135deg, ${color.hoverStart} 0%, ${color.hoverEnd} 100%) !important;
      box-shadow: 0 4px 14px ${color.gradientStart}60 !important;
    }

    /* Active Sidebar Navigation Pill */
    .sidebar-active-tab {
      background-color: ${color.badgeBgLight} !important;
      color: ${color.badgeTextLight} !important;
      border-color: ${color.accent}88 !important;
    }
    html.dark .sidebar-active-tab {
      background-color: ${color.badgeBgDark} !important;
      color: ${color.badgeTextDark} !important;
      border-color: ${color.accent}88 !important;
    }

    /* Windows & Cards Corner Styling */
    .rounded-2xl {
      border-radius: ${radius.px}px !important;
    }
    .rounded-xl {
      border-radius: ${Math.max(4, Math.round(radius.px * 0.75))}px !important;
    }
    .rounded-3xl {
      border-radius: ${Math.round(radius.px * 1.5)}px !important;
    }

    /* Form Controls & Checkboxes */
    input[type="checkbox"], input[type="radio"] {
      accent-color: ${color.accent} !important;
    }

    /* High contrast borders optional toggle */
    ${config.highContrastBorders ? `
      .border-brand-200, .border-slate-200, .border-emerald-200 {
        border-color: ${color.accent}66 !important;
      }
      .dark .border-brand-200, .dark .border-slate-700, .dark .border-[#2F3E29] {
        border-color: ${color.accent}88 !important;
      }
    ` : ''}

    /* Dynamic active tab indicator color */
    .bg-emerald-600, .bg-emerald-700 {
      background-color: ${color.accent} !important;
    }
    .text-emerald-600, .text-emerald-500, .header-window-icon {
      color: ${color.accent} !important;
    }
  `;
}
