import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { useComposedOutput } from "@/booth/hooks/useComposedOutput";
import { renderPrintHtmlFromDataUrl } from "@/booth/engines/layout/canvasLayoutEngine";

export default function StepFinalPreview() {
  const { templates, order, next, go, back } = useBoothFlow();
  const template = order.layoutType === "template" ? templates.find((t) => t.id === order.selectedTemplateId) : undefined;

  const photoUrls = order.photos.map((p) => p.url).filter(Boolean);
  const { dataUrl, loading, error } = useComposedOutput({
    mode: order.layoutType === "template" ? "template" : "strip",
    shots: order.requiredShots,
    photoUrls,
    template,
  });

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info("[final_preview] selection", {
      layoutType: order.layoutType,
      selectedTemplateId: order.selectedTemplateId,
      templateFound: !!template,
      requiredShots: order.requiredShots,
      templateShots: template?.shots,
    });
  }

  return (
    <KioskChrome title="Final preview" subtitle="Print-ready composition (canvas render engine)." showBack onBack={back}>
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card/30">
          <div className="aspect-video w-full bg-secondary/20">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Rendering…
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {error}
              </div>
            ) : dataUrl ? (
              <div className="relative h-full w-full">
                <img src={dataUrl} alt="Final composed output" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No composition</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-secondary/25 p-5">
            <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Actions</div>
            <div className="mt-4 space-y-3">
              <Button
                variant="kiosk"
                size="kiosk"
                onClick={() => next()}
                disabled={order.paymentStatus !== "success" || !dataUrl || loading || !!error}
              >
                Print
              </Button>
              <Button
                variant="outline"
                className="h-16 w-full rounded-2xl"
                onClick={() => {
                  if (!dataUrl) return;
                  const a = document.createElement("a");
                  a.href = dataUrl;
                  a.download = "nexora-print.png";
                  a.click();
                }}
                disabled={!dataUrl || loading}
              >
                QR Download (stub)
              </Button>
            </div>
            {order.paymentStatus !== "success" ? (
              <p className="mt-3 text-sm text-muted-foreground">Printing is locked until payment succeeds.</p>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-card/35 p-5 text-sm text-muted-foreground">
            The layout engine composes the selected strip/newspaper layout + template into a print-ready PNG.
          </div>

          <Button
            variant="link"
            className="px-0"
            onClick={() => {
              // quick jump back for testing
              go(order.layoutType === "template" ? "template_select" : "layout_select");
            }}
          >
            {order.layoutType === "template" ? "Change template" : "Change layout"}
          </Button>
        </div>
      </div>

      {/* export helper for print step */}
      <div className="hidden" data-print-html={dataUrl ? renderPrintHtmlFromDataUrl(dataUrl) : ""} />
    </KioskChrome>
  );
}
