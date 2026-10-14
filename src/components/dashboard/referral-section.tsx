import { Users } from "lucide-react";

export const ReferralSection = () => (
  <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-rose-500" />
      <h3 className="text-foreground text-sm font-bold">
        Venus par parrainage
      </h3>
    </div>

    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-foreground text-sm font-medium">
        Aucun parrainage pour l&apos;instant.
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Vos clients peuvent inviter leurs proches depuis leur carte.
      </p>
    </div>
  </div>
);
