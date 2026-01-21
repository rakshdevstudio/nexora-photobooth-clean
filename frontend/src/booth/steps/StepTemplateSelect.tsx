import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepTemplateSelect() {
  const { templates, order, setTemplate, next, back } = useBoothFlow();
  const filtered = templates.filter((t) => t.shots === (order.requiredShots || order.shotCount));

  return (
    <KioskChrome title="Select a template" subtitle="Templates are visual frames only; shown templates match your selected shot count." showBack onBack={back}>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-secondary/25 p-6 text-sm text-muted-foreground">
          No templates yet. Add PNG/JPG templates in the operator panel: <span className="font-medium">/admin/templates</span>.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((t) => {
            const selected = order.selectedTemplateId === t.id;
            return (
              <button
                key={t.id}
                className={
                  "overflow-hidden rounded-2xl border bg-card/30 text-left transition hover:bg-card/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" +
                  (selected ? " ring-2 ring-ring" : "")
                }
                onClick={() => setTemplate(t.id)}
              >
                <div className="aspect-[4/3] bg-secondary/20">
                  <img src={t.previewUrl} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium">{t.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button variant="kiosk" size="kiosk" onClick={next} disabled={!order.selectedTemplateId}>
          Confirm template
        </Button>
      </div>
    </KioskChrome>
  );
}
