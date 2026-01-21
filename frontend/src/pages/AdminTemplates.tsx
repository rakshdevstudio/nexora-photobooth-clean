import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { nanoid } from "@/booth/utils/nanoid";
import type { TemplateAsset } from "@/booth/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackArrowButton from "@/components/BackArrowButton";
import { getBuiltinTemplates } from "@/booth/templates/builtinTemplates";
import { loadBuiltinDisabledIds, setBuiltinTemplateEnabled } from "@/booth/admin/builtinTemplatesState";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function getImageSize(src: string): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1200, height: img.naturalHeight || 3600 });
    img.onerror = () => reject(new Error("Failed to load image for sizing"));
    img.src = src;
  });
}

export default function AdminTemplates() {
  const navigate = useNavigate();
  const { templates: allTemplates, updateTemplates } = useBoothFlow();
  const templates = useMemo(() => allTemplates.filter((t) => !t.builtin), [allTemplates]);
  const [builtinDisabled, setBuiltinDisabled] = useState(() => loadBuiltinDisabledIds());

  const stats = useMemo(() => ({ count: templates.length }), [templates.length]);

  const builtinTemplates = useMemo(() => getBuiltinTemplates(), []);
  const builtinEnabled = useMemo(
    () => builtinTemplates.filter((t) => !builtinDisabled.has(t.id)),
    [builtinDisabled, builtinTemplates],
  );

  return (
    <div className="min-h-screen nexora-surface px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm tracking-[0.28em] uppercase text-muted-foreground">Nexora</div>
            <h1 className="text-3xl font-semibold">Template Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload PNG/JPG frames. In the EXE product these should be stored on disk.</p>
          </div>
          <div className="flex items-center gap-3">
            <BackArrowButton ariaLabel="Go back" onBack={() => navigate(-1)} />
            <div className="rounded-full bg-secondary/60 px-4 py-2 text-xs text-muted-foreground">
              {builtinEnabled.length} built-in • {stats.count} custom
            </div>
          </div>
        </header>

        <Card className="border bg-card/60 p-5 shadow-elevated">
          <div className="text-sm font-medium">Built-in templates</div>
          <p className="mt-1 text-xs text-muted-foreground">Bundled with the app. Disable/enable only (not deletable).</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {builtinTemplates.map((t) => {
              const enabled = !builtinDisabled.has(t.id);
              return (
                <Card key={t.id} className="overflow-hidden border bg-card/40">
                  <div className="aspect-[4/3] bg-secondary/20">
                    <img src={t.previewUrl} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="space-y-3 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{t.shots} shots</div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant={enabled ? "outline" : "kiosk"}
                        className="h-9 rounded-xl px-3"
                        onClick={() => {
                          setBuiltinTemplateEnabled(t.id, !enabled);
                          setBuiltinDisabled(loadBuiltinDisabledIds());
                        }}
                      >
                        {enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        <Card className="border bg-card/60 p-5 shadow-elevated">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium">Add template</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                // IMPORTANT: Never persist blob: URLs. They break across reloads/windows and will render blank in kiosk.
                void (async () => {
                  try {
                    const dataUrl = await fileToDataUrl(file);
                    const size = await getImageSize(dataUrl);
                    await updateTemplates([
                      {
                        id: nanoid(),
                        name: file.name,
                        previewUrl: dataUrl,
                        layout: "strip",
                        shots: 4,
                        width: size.width,
                        height: size.height,
                        builtin: false,
                      },
                      ...templates,
                    ]);
                  } catch (err) {
                    if (import.meta.env.DEV) {
                      // eslint-disable-next-line no-console
                      console.error("[admin/templates] upload failed", err);
                    }
                    alert("Failed to import template image. Please try another file.");
                  } finally {
                    e.currentTarget.value = "";
                  }
                })();
              }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Default is 4-shot. Adjust the shot count per template so the booth only shows compatible templates.
          </p>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="overflow-hidden border bg-card/40">
              <div className="aspect-[4/3] bg-secondary/20">
                <img src={t.previewUrl} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="space-y-3 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.name}</div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">Shot count</div>
                  <Select
                    value={String(t.shots)}
                    onValueChange={(v) =>
                      void updateTemplates(templates.map((x) => (x.id === t.id ? { ...x, shots: Number(v) } : x)))
                    }
                  >
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue placeholder="Shots" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }).map((_, i) => {
                        const n = i + 1;
                        return (
                          <SelectItem key={n} value={String(n)}>
                            {n} shots
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>



                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl px-3"
                    onClick={() => void updateTemplates(templates.filter((x) => x.id !== t.id))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {templates.length === 0 ? (
            <Card className="border bg-secondary/20 p-6 text-sm text-muted-foreground sm:col-span-2 md:col-span-3">
              No templates yet. Upload a PNG/JPG to make it available in the booth flow.
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
