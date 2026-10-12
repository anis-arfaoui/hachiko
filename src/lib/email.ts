import { Resend } from "resend";

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export const DEFAULT_EMAIL_FROM = "Walaa <noreply@walaa.tech>";

interface SendPasswordResetEmailParams {
  to: string;
  url: string;
  userName?: string | null;
}

export const sendPasswordResetEmail = async ({
  to,
  url,
  userName,
}: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  id?: string;
}> => {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;
  const greeting = userName ? `Bonjour ${userName}` : "Bonjour";

  const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #0f172a;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Walaa</h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Fidélité Digitale &bull; Espace Commerçant</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">
          Réinitialisation de votre mot de passe
        </h2>
        
        <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #334155;">
          ${greeting},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
          Une demande de réinitialisation de mot de passe a été effectuée pour votre compte commerçant. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
        </p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${url}" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block; letter-spacing: 0.2px;">
                Réinitialiser mon mot de passe
              </a>
            </td>
          </tr>
        </table>
        
        <div style="background-color: #f1f5f9; border-left: 4px solid #0f172a; padding: 12px 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
            <strong>Sécurité :</strong> Ce lien est valable pendant 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message en toute sérénité. Votre compte reste parfaitement sécurisé.
          </p>
        </div>
        
        <p style="margin: 24px 0 6px 0; font-size: 12px; color: #64748b;">
          Si le bouton ci-dessus ne fonctionne pas, copiez et collez cette adresse dans votre navigateur :
        </p>
        <p style="margin: 0; font-size: 11px; word-break: break-all; color: #0284c7;">
          <a href="${url}" style="color: #0284c7; text-decoration: underline;">${url}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} Walaa. Tous droits réservés.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      process.stdout.write(
        `[Email Service] RESEND_API_KEY is not configured.\nReset link for ${to}:\n${url}\n`
      );
      return { success: true };
    }
    throw new Error("RESEND_API_KEY is not configured.");
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      html: emailHtml,
      subject: "Réinitialisation de votre mot de passe - Walaa",
      to,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        process.stderr.write(
          `[Email Service] Resend error (${error.name}): ${error.message}\n` +
            `[Email Service] Fallback test link for ${to}:\n${url}\n`
        );
        return { success: true };
      }
      throw new Error(`Erreur lors de l'envoi de l'email : ${error.message}`);
    }

    return { id: data?.id, success: true };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      process.stderr.write(
        `[Email Service] Exception sending email: ${String(error)}\n` +
          `[Email Service] Fallback test link for ${to}:\n${url}\n`
      );
      return { success: true };
    }
    throw error;
  }
};
