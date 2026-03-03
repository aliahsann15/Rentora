export const colors = {
  primary: '#1E3A8A',
  primaryLight: '#3B82F6',
  primarySoft: '#EFF6FF',

  success: '#10B981',
  successSoft: '#ECFDF5',

  warning: '#F59E0B',
  warningSoft: '#FFFBEB',

  danger: '#DC2626',
  dangerSoft: '#FEF2F2',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  divider: '#F1F5F9',

  tenantAccent: '#14B8A6',
  vendorAccent: '#334155'
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
