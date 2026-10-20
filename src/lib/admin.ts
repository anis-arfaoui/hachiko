export const getAdminEmails = (): string[] => {
  if (typeof process === "undefined" || !process.env) {
    return [];
  }

  const rawAdmins = [
    process.env.ADMIN_EMAILS,
    process.env.NEXT_PUBLIC_ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .join(",");

  return rawAdmins
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }
  const cleanEmail = email.trim().toLowerCase();
  const allowed = new Set(getAdminEmails());
  return allowed.has(cleanEmail);
};
