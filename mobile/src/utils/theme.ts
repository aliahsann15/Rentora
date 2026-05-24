export const colors = {
  // Primary palette (Stitch-picked accent shown in design)
  primary: '#3E54D3',
  primaryLight: '#6B78F6',
  primarySoft: '#EEF0FF',
  primaryDark: '#2E39A8',

  // Secondary / supportive
  secondary: '#6C74A7',
  secondaryLight: '#8F95C6',
  secondarySoft: '#F0F1F8',

  // Tertiary (accent / warning-ish alternative)
  tertiary: '#A44400',
  tertiaryLight: '#C86A2B',
  tertiarySoft: '#FFF4EA',

  // Semantic
  success: '#10B981',
  successSoft: '#ECFDF5',

  warning: '#F59E0B',
  warningSoft: '#FFFBEB',

  danger: '#DC2626',
  dangerSoft: '#FEF2F2',

  // Surfaces
  background: '#F3F4F8',
  backgroundDark: '#1F2024',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Borders / dividers
  border: '#E2E6F0',
  divider: '#EAEDF6',

  // Role accents (kept purpose-specific)
  tenantAccent: '#14B8A6',
  vendorAccent: '#6C74A7'
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
}

export const typography = {
  headingXL: 28,
  headingL: 22,
  headingM: 18,
  bodyL: 16,
  bodyM: 14,
  caption: 12
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  }
}

export const getRoleAccent = (role?: 'LANDLORD' | 'TENANT' | 'VENDOR'): string => {
  if (role === 'TENANT') {
    return colors.tenantAccent
  }

  if (role === 'VENDOR') {
    return colors.vendorAccent
  }

  return colors.primary
}

export const statusColors: Record<'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED', string> = {
  NEW: colors.primaryLight,
  ASSIGNED: colors.warning,
  IN_PROGRESS: colors.primary,
  DONE: colors.success,
  VERIFIED: colors.success
}
