import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepLayoutTypeSelect() {
  const { order, setLayoutType, go, back } = useBoothFlow();

  return (
    <KioskChrome
      title="Choose Your Layout"
      subtitle="Pick a plain strip or a designed output using templates."
      showBack
      onBack={back}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => {
            setLayoutType("strip");
            go("quantity");
          }}
          className={
            "cursor-pointer border bg-card/40 p-6 transition hover:bg-card/55" +
            (order.layoutType === "strip" ? " ring-2 ring-ring" : "")
          }
        >
          <div className="text-2xl font-semibold">Plain Strip</div>
          <p className="mt-2 text-sm text-muted-foreground">Fast, clean, minimal layout (no template).</p>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => {
            setLayoutType("template");
            go("quantity");
          }}
          className={
            "cursor-pointer border bg-card/40 p-6 transition hover:bg-card/55" +
            (order.layoutType === "template" ? " ring-2 ring-ring" : "")
          }
        >
          <div className="text-2xl font-semibold">Custom Template</div>
          <p className="mt-2 text-sm text-muted-foreground">Designed output—choose a template after payment.</p>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="kiosk" size="kiosk" onClick={() => go("quantity")} disabled={!order.layoutType}>
          Continue
        </Button>
      </div>
    </KioskChrome>
  );
}
