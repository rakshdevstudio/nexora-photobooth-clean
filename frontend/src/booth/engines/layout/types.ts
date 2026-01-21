export type ComposeInput = {
  /** Explicit render branch. Template mode is strict (no silent fallbacks). */
  mode: "strip" | "template";
  shots: number;
  photos: string[]; // urls
  /** Output canvas size driven by template (or fallback). */
  canvas: { width: number; height: number };
  templateUrl?: string;
};

export type CompositionResult = {
  width: number;
  height: number;
  /** data:image/png;base64,... */
  dataUrl: string;
};

export interface LayoutEngine {
  compose(input: ComposeInput): Promise<CompositionResult>;
}
