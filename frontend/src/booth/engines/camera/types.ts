import { type CameraSourceId } from "@/booth/types";

export type CameraCapabilities = {
  maxResolutionLabel?: string;
};

export type CameraDevice = {
  id: CameraSourceId;
  label: string;
  capabilities?: CameraCapabilities;
};

export interface CameraEngine {
  listDevices(): Promise<CameraDevice[]>;
  start(deviceId: CameraSourceId): Promise<MediaStream>;
  stop(): Promise<void>;
  captureFrame(videoEl: HTMLVideoElement): Promise<Blob>;
}
