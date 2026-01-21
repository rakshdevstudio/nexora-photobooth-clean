import type { TemplateAsset } from "@/booth/types";

type BuiltinTemplateSpec = {
  id: string;
  name: string;
  shots: number;
  width: number;
  height: number;
  variant: "minimal" | "geo" | "pastel" | "celebrate";
};

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeFrameSvg(spec: BuiltinTemplateSpec) {
  const { width: w, height: h } = spec;
  const stroke = "hsl(220 12% 18% / 0.22)";

  const deco = (() => {
    switch (spec.variant) {
      case "minimal":
        return `
          <g opacity="0.9">
            <path d="M64 120 L64 64 L120 64" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
            <path d="M${w - 64} 120 L${w - 64} 64 L${w - 120} 64" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
            <path d="M64 ${h - 120} L64 ${h - 64} L120 ${h - 64}" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
            <path d="M${w - 64} ${h - 120} L${w - 64} ${h - 64} L${w - 120} ${h - 64}" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
          </g>`;
      case "geo":
        return `
          <g opacity="0.55">
            <path d="M-200 ${h * 0.25} L${w + 200} ${h * 0.05}" stroke="hsl(187 92% 52% / 0.20)" stroke-width="20"/>
            <path d="M-200 ${h * 0.85} L${w + 200} ${h * 0.65}" stroke="hsl(270 88% 64% / 0.18)" stroke-width="20"/>
            <circle cx="${w * 0.18}" cy="${h * 0.18}" r="70" fill="hsl(187 92% 52% / 0.12)"/>
            <circle cx="${w * 0.82}" cy="${h * 0.82}" r="90" fill="hsl(270 88% 64% / 0.10)"/>
          </g>`;
      case "pastel":
        return `
          <defs>
            <radialGradient id="p1" cx="20%" cy="18%" r="70%">
              <stop offset="0%" stop-color="hsl(187 92% 52% / 0.16)"/>
              <stop offset="60%" stop-color="transparent"/>
            </radialGradient>
            <radialGradient id="p2" cx="78%" cy="30%" r="70%">
              <stop offset="0%" stop-color="hsl(270 88% 64% / 0.13)"/>
              <stop offset="60%" stop-color="transparent"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="${w}" height="${h}" fill="url(#p1)"/>
          <rect x="0" y="0" width="${w}" height="${h}" fill="url(#p2)"/>`;
      case "celebrate":
        return `
          <g opacity="0.35">
            ${Array.from({ length: 18 })
              .map((_, i) => {
                const x = Math.round((w * (i + 1)) / 19);
                const y = i % 2 === 0 ? 110 : h - 110;
                const r = 10 + (i % 4) * 4;
                const c = i % 3 === 0 ? "hsl(187 92% 52% / 0.55)" : i % 3 === 1 ? "hsl(270 88% 64% / 0.45)" : "hsl(50 100% 62% / 0.45)";
                return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
              })
              .join("\n")}
          </g>`;
    }
  })();

  // Transparent background so it can overlay the composed canvas.
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${deco}
    <rect x="44" y="44" width="${w - 88}" height="${h - 88}" rx="54" ry="54" fill="none" stroke="${stroke}" stroke-width="10"/>
    <rect x="70" y="70" width="${w - 140}" height="${h - 140}" rx="42" ry="42" fill="none" stroke="hsl(220 12% 18% / 0.10)" stroke-width="6"/>
  </svg>`;
}

const BUILTIN_SPECS: BuiltinTemplateSpec[] = [
  // 20 built-ins, all strip-canvas for now (template-driven size still works because each has width/height)
  { id: "b1_min_1", name: "Minimal Portrait", shots: 1, width: 1200, height: 3600, variant: "minimal" },
  { id: "b1_geo_1", name: "Geo Portrait", shots: 1, width: 1200, height: 3600, variant: "geo" },
  { id: "b1_pastel_1", name: "Pastel Portrait", shots: 1, width: 1200, height: 3600, variant: "pastel" },
  { id: "b1_cele_1", name: "Celebration Portrait", shots: 1, width: 1200, height: 3600, variant: "celebrate" },

  { id: "b2_min_2", name: "Minimal Duo", shots: 2, width: 1200, height: 3600, variant: "minimal" },
  { id: "b2_geo_2", name: "Geo Duo", shots: 2, width: 1200, height: 3600, variant: "geo" },
  { id: "b2_pastel_2", name: "Soft Duo", shots: 2, width: 1200, height: 3600, variant: "pastel" },
  { id: "b2_cele_2", name: "Party Duo", shots: 2, width: 1200, height: 3600, variant: "celebrate" },

  { id: "b3_min_3", name: "Minimal Trio", shots: 3, width: 1200, height: 3600, variant: "minimal" },
  { id: "b3_geo_3", name: "Geo Trio", shots: 3, width: 1200, height: 3600, variant: "geo" },
  { id: "b3_pastel_3", name: "Soft Trio", shots: 3, width: 1200, height: 3600, variant: "pastel" },

  { id: "b4_min_4", name: "Classic Strip", shots: 4, width: 1200, height: 3600, variant: "minimal" },
  { id: "b4_geo_4", name: "Geo Strip", shots: 4, width: 1200, height: 3600, variant: "geo" },
  { id: "b4_pastel_4", name: "Soft Strip", shots: 4, width: 1200, height: 3600, variant: "pastel" },
  { id: "b4_cele_4", name: "Party Strip", shots: 4, width: 1200, height: 3600, variant: "celebrate" },

  { id: "b6_min_6", name: "Minimal Six", shots: 6, width: 1200, height: 3600, variant: "minimal" },
  { id: "b6_geo_6", name: "Geo Six", shots: 6, width: 1200, height: 3600, variant: "geo" },
  { id: "b6_pastel_6", name: "Soft Six", shots: 6, width: 1200, height: 3600, variant: "pastel" },

  { id: "b8_min_8", name: "Minimal Eight", shots: 8, width: 1200, height: 3600, variant: "minimal" },
  { id: "b8_geo_8", name: "Geo Eight", shots: 8, width: 1200, height: 3600, variant: "geo" },
  { id: "b8_cele_8", name: "Sparkle Eight", shots: 8, width: 1200, height: 3600, variant: "celebrate" },
];

export function getBuiltinTemplates(): TemplateAsset[] {
  return BUILTIN_SPECS.map((s) => ({
    id: s.id,
    name: s.name,
    shots: s.shots,
    previewUrl: svgToDataUrl(makeFrameSvg(s)),
    layout: "strip",
    width: s.width,
    height: s.height,
    builtin: true,
  }));
}
