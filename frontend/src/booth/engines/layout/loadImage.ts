type LoadableImage = HTMLImageElement | ImageBitmap;

export async function loadImage(sourceUrl: string): Promise<LoadableImage> {
  // Prefer ImageBitmap for speed if available.
  // NOTE: blob: URLs are not fetchable in some contexts (and can be non-durable across reloads),
  // so skip the fetch/createImageBitmap path for them.
  if (typeof createImageBitmap === "function" && !sourceUrl.startsWith("blob:")) {
    try {
      const res = await fetch(sourceUrl);
      const blob = await res.blob();
      return await createImageBitmap(blob);
    } catch {
      // Fall back to <img> loader (e.g., when ImageBitmap decoding fails)
    }
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${sourceUrl}`));
    img.src = sourceUrl;
  });
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: LoadableImage,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[drawCover]", {
      x,
      y,
      w,
      h,
      canvasW: ctx.canvas.width,
      canvasH: ctx.canvas.height,
    });
  }
  const srcW = (img as ImageBitmap).width;
  const srcH = (img as ImageBitmap).height;

  const scale = Math.max(w / srcW, h / srcH);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (srcW - sw) / 2;
  const sy = (srcH - sh) / 2;

  ctx.drawImage(img as unknown as CanvasImageSource, sx, sy, sw, sh, x, y, w, h);
}
