/**
 * Sigenergy Dashboard — Design Tokens & Theme Constants
 * 
 * Safari-safe CSS — no CSS nesting, no :has(), minimal clamp().
 * All values match the sigenergy_dark theme YAML.
 */

export const COLORS = {
  // Base
  bg: '#1a1f2e',
  cardBg: '#22273a',
  border: '#2d3451',
  text: '#ffffff',
  textSecondary: '#8892a4',
  textMuted: '#5a6477',

  // Primary accent
  primary: '#00d4b8',
  primaryDark: '#00a693',
  primaryLight: 'rgba(0, 212, 184, 0.15)',

  // Energy colors
  solar: '#c8b84a',
  solarLight: 'rgba(200, 184, 74, 0.15)',
  battery: '#00d4b8',
  batteryLight: 'rgba(0, 212, 184, 0.15)',
  grid: '#6b7fd4',
  gridLight: 'rgba(107, 127, 212, 0.15)',
  load: '#9b59b6',
  loadLight: 'rgba(155, 89, 182, 0.15)',
  export: '#2ecc71',

  // Status
  success: '#2ecc71',
  warning: '#f1c40f',
  danger: '#e74c3c',
  info: '#3498db',

  // Price thresholds
  priceCheap: '#2ecc71',
  priceNormal: '#f1c40f',
  priceExpensive: '#e74c3c',
};

export const SIZES = {
  borderRadius: '12px',
  borderRadiusSm: '8px',
  borderRadiusLg: '16px',
  cardPadding: '16px',
  gap: '8px',
  gapLg: '16px',
};

export const FONTS = {
  family: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  sizeXs: '10px',
  sizeSm: '12px',
  sizeMd: '14px',
  sizeLg: '18px',
  sizeXl: '24px',
  sizeHero: '36px',
  weightNormal: '400',
  weightMedium: '500',
  weightBold: '700',
};

export const SHADOWS = {
  card: '0 2px 8px rgba(0, 0, 0, 0.3)',
  elevated: '0 4px 16px rgba(0, 0, 0, 0.4)',
  glow: (color) => `0 0 12px ${color}`,
};

/**
 * Helper: apply a glow animation to an element.
 * Safari-safe: uses @keyframes, not CSS animations API.
 */
export const glowKeyframes = (name, color) => `
  @keyframes ${name} {
    0%, 100% { box-shadow: 0 0 4px ${color}; }
    50% { box-shadow: 0 0 16px ${color}; }
  }
`;
