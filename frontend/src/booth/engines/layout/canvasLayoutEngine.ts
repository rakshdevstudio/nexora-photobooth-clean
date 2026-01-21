import type { CompositionResult, ComposeInput, LayoutEngine } from "./types";
import { drawCover, loadImage } from "./loadImage";

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export class CanvasLayoutEngine implements LayoutEngine {
  async compose(input: ComposeInput): Promise<CompositionResult> {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info("[CanvasLayoutEngine] compose", {
        mode: input.mode,
        selectedShots: input.shots,
        canvas: input.canvas,
        photoCount: input.photos?.filter(Boolean).length ?? 0,
        hasTemplateUrl: !!input.templateUrl,
      });

      // eslint-disable-next-line no-console
      console.log("RENDER MODE:", input.mode);
    }

    const isTemplateMode = input.mode === "template";
    const templateUrl = isTemplateMode ? input.templateUrl : undefined;
    if (isTemplateMode && !templateUrl) {
      throw new Error("Template mode requires a templateUrl");
    }

    const templateKind: "png" | "jpeg" | "svg" | "unknown" = (() => {
      if (!templateUrl) return "unknown";
      if (templateUrl.startsWith("data:image/jpeg")) return "jpeg";
      if (templateUrl.startsWith("data:image/png")) return "png";
      if (templateUrl.startsWith("data:image/svg")) return "svg";
      if (/\.jpe?g(\?|#|$)/i.test(templateUrl)) return "jpeg";
      if (/\.png(\?|#|$)/i.test(templateUrl)) return "png";
      if (/\.svg(\?|#|$)/i.test(templateUrl)) return "svg";
      return "unknown";
    })();

    // Template asset is STRICT in template mode: load must succeed.
    const templateImg = templateUrl ? await loadImage(templateUrl) : undefined;
    if (import.meta.env.DEV && templateUrl) {
      // eslint-disable-next-line no-console
      console.info("[CanvasLayoutEngine] template:load:ok", {
        kind: templateKind,
        w: (templateImg as ImageBitmap | undefined)?.width,
        h: (templateImg as ImageBitmap | undefined)?.height,
      });
    }
    // Print-friendly resolutions (fast enough in browser, scalable in EXE builds)
    // Layout is now shot-count driven; canvas size is driven by the template.
    const spec = {
      width: input.canvas.width,
      height: input.canvas.height,
      pad: Math.round(Math.min(input.canvas.width, input.canvas.height) * 0.06),
      gap: Math.round(Math.min(input.canvas.width, input.canvas.height) * 0.03),
      radius: Math.round(Math.min(input.canvas.width, input.canvas.height) * 0.03),
    };

    const canvas = createCanvas(spec.width, spec.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // Background
    // - Strip mode: always a neutral white background.
    // - Template mode:
    //    * JPEG templates are treated as an UNDERLAY (no alpha expected).
    //    * PNG/SVG templates are treated as an OVERLAY (alpha expected).
    if (isTemplateMode && templateImg && templateKind === "jpeg") {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info("[CanvasLayoutEngine] template:underlay");
      }
      ctx.drawImage(templateImg as unknown as CanvasImageSource, 0, 0, spec.width, spec.height);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, spec.width, spec.height);
    }

    // Photo slots
    const urls = input.photos.filter(Boolean);
    const shots = Math.max(1, Math.min(8, Math.round(input.shots || urls.length || 1)));

    // Simple grid presets (shot-count driven)
    const grid = (() => {
      if (shots === 1) return { cols: 1, rows: 1 };
      if (shots === 2) return { cols: 1, rows: 2 };
      if (shots === 3) return { cols: 1, rows: 3 };
      if (shots === 4) return { cols: 2, rows: 2 };
      if (shots === 5) return { cols: 2, rows: 3 };
      if (shots === 6) return { cols: 2, rows: 3 };
      if (shots === 7) return { cols: 2, rows: 4 };
      return { cols: 2, rows: 4 }; // 8
    })();

    const innerW = spec.width - spec.pad * 2;
    const innerH = spec.height - spec.pad * 2;
    const slotW = (innerW - spec.gap * (grid.cols - 1)) / grid.cols;
    const slotH = (innerH - spec.gap * (grid.rows - 1)) / grid.rows;

    for (let i = 0; i < shots; i++) {
      const r = Math.floor(i / grid.cols);
      const c = i % grid.cols;
      const x = spec.pad + c * (slotW + spec.gap);
      const y = spec.pad + r * (slotH + spec.gap);

      ctx.save();
      roundedRectPath(ctx, x, y, slotW, slotH, spec.radius);
      ctx.clip();
      ctx.fillStyle = "#f6f6f7";
      ctx.fillRect(x, y, slotW, slotH);

      const url = urls[i];
      if (url) {
        const img = await loadImage(url);
        drawCover(ctx, img, x, y, slotW, slotH);
      }
      ctx.restore();

      // Subtle border
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 4;
      roundedRectPath(ctx, x, y, slotW, slotH, spec.radius);
      ctx.stroke();
    }

    // Template overlay (STRICT in template mode)
    // For JPEG templates we do NOT overlay again (it would hide the photos). For PNG/SVG we overlay.
    if (isTemplateMode && templateImg && templateKind !== "jpeg") {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info("[CanvasLayoutEngine] template:overlay");
      }
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(templateImg as unknown as CanvasImageSource, 0, 0, spec.width, spec.height);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL("image/png");
    return { width: spec.width, height: spec.height, dataUrl };
  }
}

export function renderPrintHtmlFromDataUrl(dataUrl: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Nexora Print</title>
  <style>
    body { margin: 0; }
    img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="Nexora print" />
</body>
</html>`;
}
