"use client";

import { RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button variant="outline" className="h-11 px-4" onClick={() => window.location.reload()}>
      <RotateCwIcon /> Nochmal versuchen
    </Button>
  );
}
