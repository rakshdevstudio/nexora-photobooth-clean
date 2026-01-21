import { nanoid } from "@/booth/utils/nanoid";
import type { CameraEngine, CameraDevice } from "@/booth/engines/camera/types";
import type { CameraSourceId } from "@/booth/types";

export class WebCameraEngine implements CameraEngine {
  private stream: MediaStream | null = null;

  async listDevices(): Promise<CameraDevice[]> {
    // For phase 1 we expose two logical options; actual device selection can be layered later.
    return [
      { id: "webcam", label: "Webcam", capabilities: { maxResolutionLabel: "1080p" } },
      { id: "camera_4k", label: "4K Camera", capabilities: { maxResolutionLabel: "4K (if supported)" } },
    ];
  }

  async start(deviceId: CameraSourceId): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: false,
      video:
        deviceId === "camera_4k"
          ? { width: { ideal: 3840 }, height: { ideal: 2160 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.stream;
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  async captureFrame(videoEl: HTMLVideoElement): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const w = videoEl.videoWidth || 1280;
    const h = videoEl.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(videoEl, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error("Capture failed"));
          else resolve(b);
        },
        "image/jpeg",
        0.92,
      );
    });

    // Give the captured blob a stable-ish identity if it’s stored later by a file adapter
    (blob as any).name = `capture-${nanoid()}.jpg`;
    return blob;
  }
}
