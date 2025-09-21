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

  const start = 0;
  const duration = 3;
  const fade = options.fadeDuration || 0.5;
  const title = options.title ?? "";

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
  
  // Pisahkan posisi x dan y
  const x = options.position ? options.position.split(":")[0] : "(w-text_w)/2";
//  const y = options.position ? options.position.split(":")[1] : "50";
 const y = "80";

  // Ekspresi `alpha` yang benar
  const alphaExpression = `'if(lt(t,${start}+${fade}),(t-${start})/${fade},if(lt(t,${start}+${duration}-${fade}),1,(${start}+${duration}-t)/${fade}))'`;

  // Filter drawtext yang benar, dengan alpha yang dipisah
  const vf = `drawtext=fontfile='${fontPathForFf}':text='${textEsc}':fontcolor=${options.fontColor || "white"}:fontsize=${
    options.fontSize || 78
  }:x=${x}:y=${y}:box=1:boxcolor=black@0.5:boxborderw=5:alpha=${alphaExpression}`;

  const args = [
    "-y",
    "-i",
    inputPath,
    "-vf",
    vf,
    "-c:v",
    "libx264",
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

  throw new Error("Gagal menambahkan overlay judul di awal video.");
}