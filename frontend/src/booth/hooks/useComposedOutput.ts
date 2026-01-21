import { useEffect, useMemo, useState } from "react";
import { CanvasLayoutEngine } from "@/booth/engines/layout/canvasLayoutEngine";
import type { TemplateAsset } from "@/booth/types";

export function useComposedOutput(params: {
  mode: "strip" | "template";
  shots?: number;
  photoUrls: string[];
  template?: TemplateAsset;
}) {
  const engine = useMemo(() => new CanvasLayoutEngine(), []);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (params.photoUrls.filter(Boolean).length === 0) {
        setDataUrl(null);
        setError(null);
        return;
      }

      const shots = params.shots ?? params.template?.shots ?? params.photoUrls.length;

      if (params.mode === "template" && !params.template) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[compose] blocked: template required but missing", { shots });
        }
        setDataUrl(null);
        setError("Please select a template to continue.");
        return;
      }
      const canvas =
        params.mode === "template" && params.template
          ? { width: params.template.width, height: params.template.height }
          : { width: 1200, height: 3600 };

      // Strict compatibility guard (never silently fall back to plain output).
       if (params.mode === "template" && params.template && params.template.shots !== Math.round(shots)) {
        const message = `Template "${params.template.name}" supports ${params.template.shots} shots, but this order is ${shots}.`;
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[compose] template compatibility failed", {
            selectedTemplateId: params.template.id,
            templateShots: params.template.shots,
            orderShots: shots,
          });
        }
        setDataUrl(null);
        setError(message);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info("[compose] start", {
            mode: params.mode,
            selectedTemplateId: params.template?.id,
            shots,
            canvas,
            hasTemplateUrl: !!params.template?.previewUrl,
          });
        }
        const res = await engine.compose({
          mode: params.mode,
          shots,
          canvas,
          photos: params.photoUrls,
          templateUrl: params.template?.previewUrl,
        });
        if (!cancelled) setDataUrl(res.dataUrl);
      } catch (e) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("[compose] failed", e);
        }
        const msg = e instanceof Error ? e.message : "Failed to compose output.";
        // If this is a stale blob: URL (commonly happens after reload), show a clearer hint.
        const maybeBlob = params.photoUrls.some((u) => u.startsWith("blob:"));
        const finalMsg = maybeBlob ? `${msg} (Captured photo URLs expired — please recapture.)` : msg;
        if (!cancelled) setDataUrl(null);
        if (!cancelled) setError(finalMsg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    }, [engine, params.mode, params.shots, params.template?.id, params.template?.shots, params.template?.previewUrl, params.template?.width, params.template?.height, params.photoUrls.join("|")]);

  return { dataUrl, loading, error };
}
