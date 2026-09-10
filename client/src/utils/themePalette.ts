/**
 * Theme Color Palette System
 * Centralized color palette management for headerBar and application-wide accent colors.
 * Ensures complete application across all buttons, badges, labels, headings, and borders.
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

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  {
    id: 'moss',
    name: 'Moss Olive & Deep Forest',
    description: 'Signature clinical earth palette',
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
    name: 'Warm Walnut & Bronze',
    description: 'Executive clinical suite with warm timber tones',
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
    description: 'High-tech diagnostic & acute hospital precision',
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
    description: 'Calming pediatric & outpatient sanitary wellness',
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

const STORAGE_KEY = 'hospital_theme_color';
const STYLE_TAG_ID = 'hospital-theme-palette-styles';

export function getStoredThemeColor(): string {
  if (typeof window === 'undefined') return 'moss';
  return localStorage.getItem(STORAGE_KEY) || 'moss';
}

export function applyThemeColor(colorId: string): void {
  if (typeof document === 'undefined') return;

  const color = THEME_COLOR_OPTIONS.find(c => c.id === colorId) || THEME_COLOR_OPTIONS[0];
  const root = document.documentElement;

  // Set CSS Custom Properties on Root
  root.style.setProperty('--primary-gradient-start', color.gradientStart);
  root.style.setProperty('--primary-gradient-end', color.gradientEnd);
  root.style.setProperty('--primary-gradient-hover-start', color.hoverStart);
  root.style.setProperty('--primary-gradient-hover-end', color.hoverEnd);
  root.style.setProperty('--primary-accent', color.accent);
  root.style.setProperty('--primary-accent-hover', color.accentHover);
  root.style.setProperty('--palette-badge-bg-light', color.badgeBgLight);
  root.style.setProperty('--palette-badge-text-light', color.badgeTextLight);
  root.style.setProperty('--palette-badge-bg-dark', color.badgeBgDark);
  root.style.setProperty('--palette-badge-text-dark', color.badgeTextDark);

  // Dynamic style injection to comprehensively update all buttons, labels, badges, and accents
  let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* ==========================================================================
       DYNAMIC THEME PALETTE OVERRIDES: ${color.name}
       ========================================================================== */

    /* 1. PRIMARY AND GRADIENT BUTTONS ACROSS ALL PAGES */
    .clinical-button-primary,
    html.dark .clinical-button-primary,
    button.clinical-button-primary,
    a.clinical-button-primary {
      background: linear-gradient(135deg, ${color.gradientStart} 0%, ${color.gradientEnd} 100%) !important;
      color: #FFFFFF !important;
      box-shadow: 0 2px 6px ${color.gradientStart}40, 0 1px 2px rgba(0,0,0,0.05) !important;
    }

    .clinical-button-primary:hover,
    html.dark .clinical-button-primary:hover,
    button.clinical-button-primary:hover,
    a.clinical-button-primary:hover {
      background: linear-gradient(135deg, ${color.hoverStart} 0%, ${color.hoverEnd} 100%) !important;
      box-shadow: 0 4px 14px ${color.gradientStart}60 !important;
    }

    /* Buttons with hardcoded green/brand backgrounds */
    .bg-\\[\\#2D6A4F\\],
    .dark\\:bg-\\[\\#2D6A4F\\],
    html.dark .dark\\:bg-\\[\\#2D6A4F\\] {
      background-color: ${color.gradientStart} !important;
      color: #FFFFFF !important;
    }

    .hover\\:bg-\\[\\#1B4332\\]:hover,
    .hover\\:bg-\\[\\#2D6A4F\\]:hover {
      background-color: ${color.hoverStart} !important;
    }

    .bg-\\[\\#1B4332\\] {
      background-color: ${color.gradientEnd} !important;
    }

    /* Standard Emerald & Brand Button classes */
    .bg-emerald-600,
    .bg-emerald-700,
    .bg-emerald-800,
    html:not(.dark) .bg-emerald-600,
    html:not(.dark) .bg-brand-600,
    html.dark .bg-emerald-600 {
      background-color: ${color.accent} !important;
    }

    .hover\\:bg-emerald-700:hover,
    .hover\\:bg-emerald-800:hover,
    .hover\\:bg-brand-700:hover {
      background-color: ${color.accentHover} !important;
    }

    /* Gradient buttons with from/to */
    .from-emerald-600,
    .from-\\[\\#2D6A4F\\] {
      --tw-gradient-from: ${color.gradientStart} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${color.gradientEnd} var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }

    .to-emerald-700,
    .to-\\[\\#1B4332\\],
    .to-\\[\\#008069\\] {
      --tw-gradient-to: ${color.gradientEnd} var(--tw-gradient-to-position) !important;
    }

    /* 2. LABELS, TEXT ACCENTS & ICONS */
    .header-window-icon,
    .text-\\[\\#2D6A4F\\],
    .text-\\[\\#1B4332\\],
    .text-\\[\\#656D4A\\],
    .text-emerald-600,
    .text-emerald-700,
    .text-emerald-800,
    .text-emerald-500,
    .text-semantic-success,
    html:not(.dark) .text-emerald-600,
    html:not(.dark) .text-emerald-700,
    html:not(.dark) .text-emerald-500,
    html:not(.dark) .text-brand-600 {
      color: ${color.accent} !important;
    }

    /* Dark mode text accents */
    .dark\\:text-\\[\\#74C69D\\],
    .dark\\:text-\\[\\#52B788\\],
    .dark\\:text-emerald-400,
    .dark\\:text-emerald-300,
    html.dark .text-\\[\\#2D6A4F\\],
    html.dark .text-emerald-400,
    html.dark .text-emerald-300,
    html.dark .header-window-icon {
      color: ${color.badgeTextDark} !important;
    }

    .group:hover .group-hover\\:text-\\[\\#2D6A4F\\],
    .hover\\:text-\\[\\#2D6A4F\\]:hover {
      color: ${color.accent} !important;
    }
    html.dark .group:hover .group-hover\\:text-\\[\\#74C69D\\],
    html.dark .hover\\:text-\\[\\#74C69D\\]:hover {
      color: ${color.badgeTextDark} !important;
    }

    /* 3. BADGES, TINTS & ACTIVE INDICATORS */
    .sidebar-active-tab,
    .bg-\\[\\#EAF2EC\\],
    .bg-\\[\\#E8F3EB\\],
    .bg-emerald-50,
    .bg-emerald-100 {
      background-color: ${color.badgeBgLight} !important;
      color: ${color.badgeTextLight} !important;
    }

    html.dark .sidebar-active-tab,
    html.dark .bg-\\[\\#EAF2EC\\],
    html.dark .bg-\\[\\#E8F3EB\\],
    html.dark .bg-\\[\\#203622\\],
    html.dark .bg-\\[\\#2D3923\\],
    html.dark .bg-\\[\\#273B25\\],
    html.dark .bg-\\[\\#2D3E2F\\],
    html.dark .bg-emerald-950,
    html.dark .bg-emerald-950\\/50 {
      background-color: ${color.badgeBgDark} !important;
      color: ${color.badgeTextDark} !important;
    }

    /* 4. BORDERS & FOCUS RINGS */
    .border-\\[\\#2D6A4F\\],
    .border-\\[\\#656D4A\\],
    .border-emerald-600,
    .border-emerald-500,
    .border-emerald-300,
    .border-emerald-200,
    .hover\\:border-\\[\\#2D6A4F\\]:hover,
    html:not(.dark) .border-brand-600 {
      border-color: ${color.accent} !important;
    }

    html.dark .border-\\[\\#2D6A4F\\],
    html.dark .border-emerald-800,
    html.dark .border-emerald-700,
    html.dark .hover\\:border-\\[\\#74C69D\\]:hover,
    html.dark .hover\\:border-\\[\\#2D6A4F\\]:hover {
      border-color: ${color.accent}88 !important;
    }

    .focus\\:ring-\\[\\#2D6A4F\\]:focus,
    .focus\\:ring-emerald-500:focus,
    .ring-\\[\\#2D6A4F\\] {
      --tw-ring-color: ${color.accent} !important;
    }

    input[type="checkbox"],
    input[type="radio"] {
      accent-color: ${color.accent} !important;
    }
  `;

  localStorage.setItem(STORAGE_KEY, color.id);
  window.dispatchEvent(new CustomEvent('hospital_theme_color_changed', { detail: color }));
}
