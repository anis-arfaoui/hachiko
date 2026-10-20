export const DEFAULT_ADMIN_EMAILS = ["anisarfaoui2525@gmail.com"];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }
  const cleanEmail = email.trim().toLowerCase();

  const rawAdmins = [
    ...(typeof process !== "undefined" && process.env?.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(",")
      : []),
    ...(typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_EMAILS
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",")
      : []),
  ];
  const envAdmins: string[] = [];
  for (const e of rawAdmins) {
    const trimmed = e.trim().toLowerCase();
    if (trimmed) {
      envAdmins.push(trimmed);
    }
  }

  const allowed = new Set([...DEFAULT_ADMIN_EMAILS, ...envAdmins]);
  return allowed.has(cleanEmail);
};
