import { Share2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ReferralSection = () => (
  <Card className="shadow-xs">
    <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base">
              Parrainage Clients
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Nouveaux membres invités par leurs proches
            </p>
          </div>
        </div>
        <Badge variant="neutral" size="sm">
          0 parrainage
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
      <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
        <div className="bg-primary/10 text-primary mb-2 flex h-9 w-9 items-center justify-center rounded-xl">
          <Share2 className="h-4 w-4" />
        </div>
        <p className="text-foreground text-sm font-semibold">
          Aucun parrainage enregistré pour le moment
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs">
          Vos clients peuvent partager leur lien de parrainage directement
          depuis leur carte dématérialisée.
        </p>
      </div>
    </CardContent>
  </Card>
);
