/**
 * Theme Color Palette System
 * Centralized color palette management for headerBar and application-wide accent colors.
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

  // Set CSS Custom Properties
  root.style.setProperty('--primary-gradient-start', color.gradientStart);
  root.style.setProperty('--primary-gradient-end', color.gradientEnd);
  root.style.setProperty('--primary-gradient-hover-start', color.hoverStart);
  root.style.setProperty('--primary-gradient-hover-end', color.hoverEnd);
  root.style.setProperty('--primary-accent', color.accent);
  root.style.setProperty('--primary-accent-hover', color.accentHover);

  // Dynamic style injection for buttons, icons, sidebar active tab, and badges
  let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    .clinical-button-primary {
      background: linear-gradient(135deg, ${color.gradientStart} 0%, ${color.gradientEnd} 100%) !important;
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

    /* Accent icons & badges */
    .header-window-icon, .text-emerald-600, .text-emerald-500 {
      color: ${color.accent} !important;
    }
    .bg-emerald-600, .bg-emerald-700 {
      background-color: ${color.accent} !important;
    }
    input[type="checkbox"], input[type="radio"] {
      accent-color: ${color.accent} !important;
    }
  `;

  localStorage.setItem(STORAGE_KEY, color.id);
  window.dispatchEvent(new CustomEvent('hospital_theme_color_changed', { detail: color }));
}
