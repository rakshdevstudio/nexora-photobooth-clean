import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { useComposedOutput } from "@/booth/hooks/useComposedOutput";
import { renderPrintHtmlFromDataUrl } from "@/booth/engines/layout/canvasLayoutEngine";

export default function StepPrint() {
  const { templates, order, printNow, next, go, back } = useBoothFlow();
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
    console.info("[print] selection", {
      layoutType: order.layoutType,
      selectedTemplateId: order.selectedTemplateId,
      templateFound: !!template,
      requiredShots: order.requiredShots,
      templateShots: template?.shots,
    });
  }

  useEffect(() => {
    if (order.paymentStatus !== "success") go("summary");
  }, [order.paymentStatus, go]);

  return (
    <KioskChrome title="Print" subtitle="Prints the composed layout via the print engine." showBack onBack={back}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-secondary/25 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Status</div>
          <div className="mt-2 text-lg font-semibold">{loading ? "Rendering…" : error ? "Template error" : "Ready to print"}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment verified. {loading ? "Preparing print-ready output." : error ? error : "This action is allowed."}
          </p>
        </div>

        <div className="rounded-2xl border bg-card/40 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Actions</div>
          <div className="mt-4 space-y-3">
            <Button
              variant="kiosk"
              size="kiosk"
              disabled={!dataUrl || loading || !!error}
              onClick={async () => {
                if (!dataUrl) return;
                const html = renderPrintHtmlFromDataUrl(dataUrl);
                await printNow(html);
              }}
            >
              Open Print Dialog
            </Button>
            <Button variant="soft" size="kiosk" onClick={() => next()}>
              Finish
            </Button>
          </div>
        </div>
      </div>
    </KioskChrome>
  );
}
