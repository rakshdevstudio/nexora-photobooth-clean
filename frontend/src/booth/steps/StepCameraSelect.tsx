import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { WebCameraEngine } from "@/booth/engines/camera/webCameraEngine";
import type { CameraSourceId } from "@/booth/types";

export default function StepCameraSelect() {
  const { order, next, back } = useBoothFlow();
  const [devices, setDevices] = useState<Array<{ id: CameraSourceId; label: string; hint?: string }>>([]);

  useEffect(() => {
    const engine = new WebCameraEngine();
    engine.listDevices().then((d) => setDevices(d.map((x) => ({ id: x.id, label: x.label, hint: x.capabilities?.maxResolutionLabel }))));
  }, []);

  return (
    <KioskChrome title="Select your camera" subtitle="Phase 1 supports webcam / 4K mode. Future sources plug into the camera engine." showBack onBack={back}>
      <div className="grid gap-4 md:grid-cols-2">
        {devices.map((d) => (
          <button
            key={d.id}
            className={
              "rounded-2xl border bg-card/40 p-6 text-left transition hover:bg-card/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" +
              (order.cameraSource === d.id ? " ring-2 ring-ring" : "")
            }
            onClick={() => {
              // stored in order for later device selection (future)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (order as any).cameraSource = d.id;
              next();
            }}
          >
            <div className="text-xl font-semibold">{d.label}</div>
            <div className="mt-2 text-sm text-muted-foreground">{d.hint ?? ""}</div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="kiosk" size="kiosk" onClick={next}>
          Continue
        </Button>
      </div>
    </KioskChrome>
  );
}
