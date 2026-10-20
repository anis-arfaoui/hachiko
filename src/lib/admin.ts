export const DEFAULT_ADMIN_EMAILS = [
  "djalelbrik@gmail.com",
  "lpc0552@gmail.com",
  "anisarfaoui2525@gmail.com",
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }
  const cleanEmail = email.trim().toLowerCase();

  const envAdmins =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_EMAILS
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map((e) =>
          e.trim().toLowerCase()
        )
      : [];

  const allowed = new Set([...DEFAULT_ADMIN_EMAILS, ...envAdmins]);
  return allowed.has(cleanEmail);
};
