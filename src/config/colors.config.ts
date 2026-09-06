/**
 * STRICT 5 BRAND DESIGN TOKENS & SYSTEM LAWS
 * Primary visual hierarchy remains governed strictly by these 5 tokens.
 */
export const BRAND_TOKENS = {
  // Base Surface: Primary application canvas, informational backgrounds, AI message surface, active list row selection
  COLOR_50_BASE_SURFACE: '#E0FBFC',

  // Secondary Surface: Surface cards, panel containers, input fields, subtle boundaries, table header backgrounds
  COLOR_100_SECONDARY_SURFACE: '#C2DFE3',

  // Structural Grid: 1px solid card borders, structural grid dividers, inactive control borders, timeline track lines
  COLOR_300_STRUCTURAL_GRID: '#9DB4C0',

  // Label Ink: Sub-labels, metadata, timestamps, input placeholders, doctor secondary qualifications
  COLOR_600_LABEL_INK: '#5C6B73',

  // Contrast Ink: Primary page typography, large-scale token digits, primary solid interactive buttons, high-priority status indicators
  COLOR_900_CONTRAST_INK: '#253237',

  // Semantic Subordination: Restrained 8px dot accents or subtle text indicators
  SEMANTIC_ACCENTS: {
    EMERGENCY: '#E63946',
    SUCCESS: '#2A9D8F',
    WARNING: '#E76F51',
    INFO: '#457B9D'
  }
} as const;

export type BrandTokenKey = keyof typeof BRAND_TOKENS;
