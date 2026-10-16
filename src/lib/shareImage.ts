// Draws an ayah on a picture (PNG) that can be saved or shared.
export type ShareStyle = "light" | "dark" | "green";

const STYLES: Record<ShareStyle, { bg: string; ink: string; muted: string; accent: string }> = {
  light: { bg: "#faf8f3", ink: "#1b2b24", muted: "#6b7a72", accent: "#b8913a" },
  dark: { bg: "#0e1512", ink: "#e8efea", muted: "#93a39a", accent: "#d6b35c" },
  green: { bg: "#0f5c46", ink: "#ffffff", muted: "#cfe5db", accent: "#f0d58a" },
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderAyahImage(opts: {
  arabic: string;
  translation?: string;
  translationIsUrdu?: boolean;
  reference: string; // e.g. "Al-Baqarah 2:255"
  style: ShareStyle;
}): Promise<Blob> {
  const W = 1080;
  const pad = 90;
  const s = STYLES[opts.style];
  try {
    await Promise.all([
      document.fonts.load('48px "Amiri Quran"'),
      document.fonts.load('30px "Noto Nastaliq Urdu"'),
      document.fonts.load('28px "Inter"'),
    ]);
  } catch {
    /* fonts are optional */
  }

  // First pass on a scratch canvas to measure the height.
  const measure = document.createElement("canvas").getContext("2d")!;
  const arSize = opts.arabic.length > 260 ? 38 : opts.arabic.length > 140 ? 46 : 56;
  measure.font = `${arSize}px "Amiri Quran", serif`;
  measure.direction = "rtl";
  const arLines = wrap(measure, opts.arabic, W - pad * 2);
  const trSize = opts.translationIsUrdu ? 32 : 30;
  measure.font = opts.translationIsUrdu ? `${trSize}px "Noto Nastaliq Urdu", serif` : `${trSize}px Inter, sans-serif`;
  const trLines = opts.translation ? wrap(measure, opts.translation, W - pad * 2) : [];

  const arLH = arSize * 1.9;
  const trLH = opts.translationIsUrdu ? trSize * 2.0 : trSize * 1.55;
  const H = Math.max(1080, Math.round(pad + 40 + arLines.length * arLH + 60 + trLines.length * trLH + 150 + 130));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, W, H);

  // thin frame
  ctx.strokeStyle = s.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  let y = pad + 60;
  ctx.textAlign = "center";
  ctx.fillStyle = s.ink;
  ctx.direction = "rtl";
  ctx.font = `${arSize}px "Amiri Quran", serif`;
  for (const l of arLines) {
    ctx.fillText(l, W / 2, y);
    y += arLH;
  }

  y += 20;
  ctx.fillStyle = s.accent;
  ctx.fillRect(W / 2 - 60, y - 20, 120, 3);
  y += 40;

  ctx.fillStyle = s.ink;
  ctx.direction = opts.translationIsUrdu ? "rtl" : "ltr";
  ctx.font = opts.translationIsUrdu ? `${trSize}px "Noto Nastaliq Urdu", serif` : `${trSize}px Inter, sans-serif`;
  for (const l of trLines) {
    ctx.fillText(l, W / 2, y);
    y += trLH;
  }

  y += 20;
  ctx.direction = "ltr";
  ctx.fillStyle = s.muted;
  ctx.font = `600 28px Inter, sans-serif`;
  ctx.fillText(opts.reference, W / 2, y);

  // logo + name
  const logo = await loadImage("/logo.png");
  if (logo) {
    const ls = 84;
    ctx.drawImage(logo, W / 2 - ls / 2, H - 150, ls, ls);
  }
  ctx.fillStyle = s.muted;
  ctx.font = `500 22px Inter, sans-serif`;
  ctx.fillText("Noor ul Ilm · نور العلم", W / 2, H - 52);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/png"),
  );
}
