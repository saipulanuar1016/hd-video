import path from "path";
import { ensureDir, spawnCmd } from "./utils.js";

export type VideoQuality = "hd" | "2k" | "4k" | "custom";

const presets: Record<VideoQuality, { width: number; filter: string }> = {
  hd: {
    width: 1280,
    filter:
      "scale=1280:-2:flags=lanczos,unsharp=7:7:1.5:7:7:0.5,eq=contrast=1.15:saturation=1.2:brightness=0.03",
  },
  "2k": {
    width: 2048,
    filter:
      "scale=2048:-2:flags=lanczos,unsharp=8:8:1.7:8:8:0.6,eq=contrast=1.25:saturation=1.35:brightness=0.07",
  },
  "4k": {
    width: 3840,
    filter:
      "scale=3840:-2:flags=lanczos,hqdn3d,unsharp=9:9:2.0:9:9:0.8,eq=contrast=1.35:saturation=1.45:brightness=0.12",
  },
  custom: {
    width: 0,
    filter:
      "scale={width}:-2:flags=lanczos,unsharp=6:6:1.2:6:6:0.4,eq=contrast=1.18:saturation=1.25:brightness=0.05",
  },
};

export async function upscaleVideo(
  inputPath: string,
  outputPath: string,
  quality: VideoQuality = "hd",
  customWidth?: number
) {
  ensureDir(path.dirname(outputPath));

  const preset = presets[quality];
  const vf =
    quality === "custom" && customWidth
      ? preset.filter.replace("{width}", customWidth.toString())
      : preset.filter;

  try {
    const args = [
      "-y", // overwrite tanpa tanya
      "-i", inputPath,
      "-vf", vf,
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "18",
      "-c:a", "copy",
      outputPath,
    ];

    const res = await spawnCmd("ffmpeg", args);
    if (res.code === 0) {
      return outputPath;
    }
  } catch (e) {
    console.error("ffmpeg upscale failed:", e);
  }

  throw new Error("Upscale video gagal. Pastikan ffmpeg terinstall.");
}
