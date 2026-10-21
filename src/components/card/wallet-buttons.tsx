"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { getGoogleWalletSaveUrlAction } from "@/app/actions/wallet";

interface WalletButtonsProps {
  brandColor?: string;
  token: string;
}

export const WalletButtons = ({ brandColor, token }: WalletButtonsProps) => {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleWalletClick = async () => {
    setIsLoadingGoogle(true);
    setGoogleError(null);

    try {
      const result = await getGoogleWalletSaveUrlAction(token);
      if (result.success && result.saveUrl) {
        setIsLoadingGoogle(false);
        window.location.href = result.saveUrl;
        return;
      }
      setGoogleError(result.error || "Impossible de générer le pass.");
      setIsLoadingGoogle(false);
    } catch (error) {
      console.error("[GoogleWallet] Error:", error);
      setGoogleError("Erreur de connexion. Veuillez réessayer.");
      setIsLoadingGoogle(false);
    }
  };

  const dynamicColor = brandColor || "#18181b";

  return (
    <div className="space-y-3">
      <div className="text-center text-[11px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
        Ajouter à votre Wallet
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Google Wallet Button */}
        <button
          type="button"
          onClick={handleGoogleWalletClick}
          disabled={isLoadingGoogle}
          style={{
            borderColor: dynamicColor,
            color: dynamicColor,
          }}
          className="relative flex h-12 w-full items-center justify-center gap-3 rounded-2xl border-2 bg-white px-4 text-sm font-bold shadow-xs transition-all hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-70 dark:bg-zinc-950"
        >
          {isLoadingGoogle ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Génération du pass...</span>
            </>
          ) : (
            <>
              {/* Google G / Wallet Icon */}
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.4 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Ajouter à Google Wallet</span>
            </>
          )}
        </button>

        {googleError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-center text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
            {googleError}
          </div>
        )}
      </div>
    </div>
  );
};
