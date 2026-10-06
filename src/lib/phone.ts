const ALGERIAN_PHONE_REGEX = /^0[5-7]\d{8}$/u;

export const normalizeAlgerianPhone = (input: string): string => {
  const cleaned = input.replaceAll(/[\s\-().]/gu, "");

  if (cleaned.startsWith("+213")) {
    return `0${cleaned.slice(4)}`;
  }

  if (cleaned.startsWith("00213")) {
    return `0${cleaned.slice(5)}`;
  }

  if (cleaned.startsWith("213")) {
    return `0${cleaned.slice(3)}`;
  }

  return cleaned;
};

export const isValidAlgerianPhone = (phone: string): boolean => {
  const normalized = normalizeAlgerianPhone(phone);
  return ALGERIAN_PHONE_REGEX.test(normalized);
};
