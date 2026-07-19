const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{7,20}$/;

export type AuthFieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function validateEmail(email: string): string | null {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validateRequired(value: string, label: string, minLength = 1, maxLength = 120): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return `${label} is required.`;
  }

  if (trimmedValue.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }

  if (trimmedValue.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include a number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character.";
  }

  return null;
}

export function validateLoginPassword(password: string): string | null {
  return password ? null : "Password is required.";
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return "Confirm your password.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

export function validateOptionalPhone(phone: string): string | null {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return null;
  }

  if (!PHONE_PATTERN.test(trimmedPhone)) {
    return "Enter a valid phone number.";
  }

  return null;
}

export function extractResetToken(value: string): string {
  const trimmedValue = value.trim();
  const rentoraPrefix = "rentora://reset-password/";

  if (trimmedValue.startsWith(rentoraPrefix)) {
    return trimmedValue.slice(rentoraPrefix.length);
  }

  try {
    const url = new URL(trimmedValue);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return pathParts.at(-1) || trimmedValue;
  } catch {
    return trimmedValue;
  }
}

export function validateResetToken(token: string): string | null {
  if (!extractResetToken(token)) {
    return "Reset token is required.";
  }

  return null;
}
