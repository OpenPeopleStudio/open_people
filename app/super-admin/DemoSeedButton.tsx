"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoSeedButton({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const show = process.env.NODE_ENV === "development" && demoMode;
  if (!show) return null;

  const onSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    setResult(null);
    try {
      const res = await fetch("/api/super-admin/demo/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setResult({ ok: true, message: "Seeded demo tenants + notification analytics." });
      router.refresh();
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Seed failed" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={onSeed}
        disabled={seeding}
        className="btn-secondary text-sm disabled:opacity-50"
        title="Dev-only: seed demo tenants + notification metrics"
      >
        {seeding ? "Seeding…" : "Seed demo data"}
      </button>
      {result && (
        <p className={`text-xs ${result.ok ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}

