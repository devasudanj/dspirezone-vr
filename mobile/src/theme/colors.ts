/**
 * src/theme/colors.ts
 * -------------------
 * Brand color palette for Dspire VR Zone.
 * Dark theme optimised for indoor VR center lighting.
 */
const Colors = {
  // Background hierarchy
  background: '#0D0D1A',        // Deepest background
  surface: '#1A1A2E',           // Card / panel background
  surfaceAlt: '#16213E',        // Slightly lighter surface

  // Brand / accent
  primary: '#6C63FF',           // Vibrant purple – primary action
  primaryLight: '#9D97FF',
  primaryDark: '#4A43CC',
  accent: '#00D4FF',            // Cyan highlight

  // Semantic status colours
  success: '#00C851',           // Active installation ✅
  warning: '#FFB300',           // Expiring soon ⚠
  danger: '#FF4444',            // Expired ❌
  disabled: '#555577',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#666688',
  textOnPrimary: '#FFFFFF',

  // Borders / dividers
  border: '#2A2A4A',
  divider: '#1E1E3A',

  // Duration button palette
  duration10: '#FF6B6B',
  duration30: '#4ECDC4',
  duration45: '#45B7D1',
  duration60: '#96CEB4',
} as const;

export default Colors;
