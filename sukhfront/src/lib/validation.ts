// Shared validation helpers for names, register numbers, and phone numbers

// Accept Mongolian Cyrillic and Latin letters, allow spaces, hyphen and dot
const NAME_REGEX =
  /^[A-Za-z\u0401\u0451\u0410-\u044F\u04E8\u04E9\u04AE\u04AF][A-Za-z\u0401\u0451\u0410-\u044F\u04E8\u04E9\u04AE\u04AF\-\.\s]*$/;

// Two uppercase letters (Latin or Cyrillic) followed by 8 digits, e.g. "АА12345678" or "AA12345678"
const REGISTER_REGEX = /^([A-Z\u0410-\u042F\u04E8\u04AE]){2}\d{8}$/;

// Mongolian phone numbers are 8 digits
const PHONE_REGEX = /^\d{8}$/;

export function normalizeRegister(value: string): string {
  return (value || "").toUpperCase();
}

export function isValidName(value: string): boolean {
  const v = String(value || "").trim();
  if (!v) return false;
  return NAME_REGEX.test(v);
}

export function isValidRegister(value: string): boolean {
  const v = normalizeRegister(value).trim();
  return REGISTER_REGEX.test(v);
}

export function isValidPhone(value: string): boolean {
  const v = String(value || "").trim();
  return PHONE_REGEX.test(v);
}

export function areValidPhones(list: string[] | string): boolean {
  if (Array.isArray(list)) {
    // Accept empty values filtered out; require at least one valid phone if any present
    const cleaned = list.map((s) => String(s || "").trim()).filter(Boolean);
    if (cleaned.length === 0) return false;
    return cleaned.every((p) => isValidPhone(p));
  }
  return isValidPhone(list);
}

export function explainRegisterRule(): string {
  return "РД дугаар нь 2 том үсэг + 8 цифр (ж: АА12345678) байх ёстой.";
}

export function explainPhoneRule(): string {
  return "Утасны дугаар 8 оронтой тоо байх ёстой (ж: 99123456).";
}
