"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminLogoutBar() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/admin/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "inline-flex items-center gap-1.5 no-underline",
        )}
      >
        <Home className="h-4 w-4" />
        На головну
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        disabled={busy}
        className="inline-flex items-center gap-1.5"
      >
        <LogOut className="h-4 w-4" />
        {busy ? "Вихід…" : "Вийти"}
      </Button>
    </div>
  );
}
