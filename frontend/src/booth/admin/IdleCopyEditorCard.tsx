import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyIdleCopyConfig,
  defaultIdleCopyConfig,
  loadIdleCopyConfig,
} from "@/booth/idle/idleCopy";
import type { IdleCopyConfig } from "@/booth/idle/idleCopy";

type DraftVariant = { headline: string; subheading: string };

function toDraft(cfg: IdleCopyConfig) {
  return {
    intervalSec: Math.round(cfg.intervalMs / 1000),
    variants: cfg.variants.map((v) => ({ headline: v.headline, subheading: v.subheading })),
  };
}

function sanitizeDraft(draft: { intervalSec: number; variants: DraftVariant[] }): IdleCopyConfig {
  const intervalSec = Number.isFinite(draft.intervalSec) ? Math.round(draft.intervalSec) : 30;
  const intervalMs = Math.min(120_000, Math.max(10_000, intervalSec * 1000));

  const variants = draft.variants
    .map((v) => ({ headline: v.headline.trim(), subheading: v.subheading.trim() }))
    .filter((v) => v.headline.length > 0 && v.subheading.length > 0)
    .slice(0, 5);

  return {
    version: 1,
    intervalMs,
    variants: variants.length ? variants : defaultIdleCopyConfig().variants,
  };
}

export default function IdleCopyEditorCard() {
  const initial = useMemo(() => toDraft(loadIdleCopyConfig()), []);
  const [intervalSec, setIntervalSec] = useState<number>(initial.intervalSec);
  const [variants, setVariants] = useState<DraftVariant[]>(() => initial.variants.slice(0, 3));
  const [error, setError] = useState<string | null>(null);

  const canAdd = variants.length < 3;
  const canRemove = variants.length > 2;

  const save = () => {
    const next = sanitizeDraft({ intervalSec, variants });
    // Validation: enforce 2–3 variants for attract carousel.
    if (next.variants.length < 2) {
      setError("Add at least 2 variants (headline + subheading).\nEmpty fields are ignored.");
      return;
    }
    if (next.variants.length > 3) {
      setError("Maximum 3 variants supported in Admin UI.");
      return;
    }
    setError(null);
    applyIdleCopyConfig(next);
  };

  const reset = () => {
    const next = defaultIdleCopyConfig();
    const d = toDraft(next);
    setIntervalSec(d.intervalSec);
    setVariants(d.variants.slice(0, 3));
    setError(null);
    applyIdleCopyConfig(next);
  };

  return (
    <Card className="border bg-card/60 p-5 shadow-elevated">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Idle screen copy</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Controls the rotating headline + subheading on the kiosk start screen. Saved locally on this device.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={reset}>
            Reset
          </Button>
          <Button variant="kiosk" className="rounded-xl" onClick={save}>
            Save
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-2">
          <Label>Interval (seconds)</Label>
          <Input
            inputMode="numeric"
            value={String(intervalSec)}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value));
              // Keep editable, clamp on save.
              setIntervalSec(Number.isFinite(n) ? n : intervalSec);
              setError(null);
            }}
            placeholder="30"
          />
          <div className="text-xs text-muted-foreground">Range: 10–120. Recommended: ~30.</div>
        </div>

        <div className="grid gap-4">
          {variants.map((v, idx) => (
            <div key={idx} className="rounded-xl border bg-secondary/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-muted-foreground">Variant {idx + 1}</div>
                {canRemove ? (
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg px-3 text-xs"
                    onClick={() => {
                      setVariants((prev) => prev.filter((_, i) => i !== idx));
                      setError(null);
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-3">
                <div className="grid gap-2">
                  <Label>Headline</Label>
                  <Textarea
                    value={v.headline}
                    rows={2}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, headline: val } : x)));
                      setError(null);
                    }}
                    placeholder={'Tap to begin\nyour session.'}
                  />
                  <div className="text-xs text-muted-foreground">Tip: use a newline for a two-line headline.</div>
                </div>

                <div className="grid gap-2">
                  <Label>Subheading</Label>
                  <Textarea
                    value={v.subheading}
                    rows={2}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, subheading: val } : x)));
                      setError(null);
                    }}
                    placeholder="A calm, premium flow—made for queues, built for reliability."
                  />
                </div>
              </div>
            </div>
          ))}

          {canAdd ? (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setVariants((prev) => [...prev, { headline: "", subheading: "" }]);
                setError(null);
              }}
            >
              Add variant (max 3)
            </Button>
          ) : null}
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}
      </div>
    </Card>
  );
}
