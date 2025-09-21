import path from "path";
import sharp from "sharp";
import { ensureDir } from "./utils.js";

export type PhotoQuality = "hd" | "2k" | "4k" | "custom";

const photoPresets: Record<PhotoQuality, { width: number; enhance: (img: sharp.Sharp) => sharp.Sharp }> = {
  hd: {
    width: 1280,
    enhance: (img) =>
      img
        .modulate({ brightness: 1.05, saturation: 1.2 }) // warna naik sedikit
        .sharpen(1.5), // tajam
  },
  "2k": {
    width: 2048,
    enhance: (img) =>
      img
        .modulate({ brightness: 1.1, saturation: 1.3, hue: 5 }) // vivid
        .sharpen(2.0), // lebih tajam
  },
  "4k": {
    width: 3840,
    enhance: (img) =>
      img
        .modulate({ brightness: 1.15, saturation: 1.4, hue: 10 })
        .sharpen(3.0) // super tajam
        .linear(1.2, -10), // kontras boost
  },
  custom: {
    width: 0,
    enhance: (img) =>
      img
        .modulate({ brightness: 1.1, saturation: 1.2 })
        .sharpen(2.0),
  },
};

export async function upscaleImage(
  inputPath: string,
  outputPath: string,
  quality: PhotoQuality = "hd",
  customWidth?: number
) {
  ensureDir(path.dirname(outputPath));
  const preset = photoPresets[quality];

  try {
    const width = quality === "custom" && customWidth ? customWidth : preset.width;
    let image = sharp(inputPath).resize({ width });
    image = preset.enhance(image);

    await image.toFile(outputPath);
    return outputPath;
  } catch (e) {
    console.error("sharp upscale failed:", e);
    throw new Error("Upscale photo gagal. Pastikan sharp terinstall.");
  }
}
