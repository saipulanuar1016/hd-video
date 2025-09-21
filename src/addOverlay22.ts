import path from "path";
import { ensureDir, spawnCmd } from "./utils.js";

export async function addTitleOverlay(
  inputPath: string,
  outputPath: string,
  options: {
    title: string;
    fontSize?: number;
    fontColor?: string;
    position?: string;
    fadeDuration?: number;
  }
) {
  ensureDir(path.dirname(outputPath));

  const title = options.title ?? "";
  const fontSize = options.fontSize ?? 48;
  const fontColor = options.fontColor ?? "white";
  const position = options.position ?? "center";
  const fadeDuration = options.fadeDuration ?? 3;

  // Resolve font path relative to process cwd (robust for dist builds)
  const rawFontPath = path.resolve(process.cwd(), "public", "bear.ttf");

  // ffmpeg filter parser uses ':' as option separator.
  // On Windows absolute paths contain ':' (e.g. C:/...), which breaks the parser.
  // Convert backslashes to forward slashes and escape ':' with '\:'
  const fontPathForFf = rawFontPath.replace(/\\/g, "/").replace(/:/g, "\\:");

  // Escape text for drawtext: escape backslashes, colons and single quotes
  const escapeForDrawtext = (s: string) =>
    s
      .replace(/\\/g, "\\\\") // backslash -> escaped backslash
      .replace(/:/g, "\\:")       // colon -> escaped colon
      .replace(/'/g, "\\'");      // single quote -> escaped single quote

  const textEsc = escapeForDrawtext(title);

  // Positioning: keep simple presets (center, top, bottom, left, right)
  let x = "(w-text_w)/2";
  let y = "(h-text_h)/2";
  if (position === "top") y = "h*0.08";
  if (position === "bottom") y = "h-text_h-h*0.08";
  if (position === "left") { x = "w*0.06"; y = "h/2-text_h/2"; }
  if (position === "right") { x = "w-text_w-w*0.06"; y = "h/2-text_h/2"; }

  // Enable expression to show only at beginning for fadeDuration seconds
  const enableExpr = `between(t,0,${fadeDuration})`;

  // Build drawtext filter with escaped font path and text
  const vf = `drawtext=fontfile='${fontPathForFf}':text='${textEsc}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${x}:y=${y}:box=1:enable='${enableExpr}'`;

  const args = [
    "-y",
    "-i",
    inputPath,
    "-vf",
    vf,
    "-preset",
    "medium",
    "-crf",
    "20",
    "-c:a",
    "copy",
    outputPath,
  ];

  const res = await spawnCmd("ffmpeg", args);

  if (res.code === 0) return outputPath;

  // Forward ffmpeg stderr to help debugging.
  throw new Error("Gagal menambahkan overlay judul di awal video.\nffmpeg stderr:\n" + res.stderr);
}
