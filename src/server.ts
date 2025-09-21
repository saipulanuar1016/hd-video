import express from "express";
import multer from "multer";
import path from "path";
import { ensureDir } from "./utils.js";
import { upscaleImage } from "./photo.js";
import { upscaleVideo } from "./video.js";
import { addTitleOverlay } from "./addOverlay.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const INPUT_DIR = path.join(UPLOAD_DIR, "input");
const OUTPUT_DIR = path.join(UPLOAD_DIR, "output");
ensureDir(INPUT_DIR);
ensureDir(OUTPUT_DIR);

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, INPUT_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// app.get("/", (_req, res) => res.redirect("/public/index.html"));
app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.post("/api/upscale", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const mime = req.file.mimetype;
    const inputPath = req.file.path;
    const base = path.basename(inputPath);
    const outPath = path.join(OUTPUT_DIR, base);

    if (mime.startsWith("image/")) {
      const q = (req.body.quality as any) || "hd";
      await upscaleImage(inputPath, outPath, q);
      return res.json({ ok: true, url: `/uploads/output/${path.basename(outPath)}` });
    }

    if (mime.startsWith("video/")) {
      const q = (req.body.quality as any) || "hd";
      const finalOut = outPath.endsWith(".mp4") ? outPath : outPath + ".mp4";
      await upscaleVideo(inputPath, finalOut, q);
      return res.json({ ok: true, url: `/uploads/output/${path.basename(finalOut)}` });
    }

    res.status(400).json({ error: "Unsupported file type" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.post("/api/addtitle", upload.single("video"), async (req, res) => {
    try {
        if (!req.file || !req.body.title) {
            return res.status(400).json({ error: "Please upload a video and provide a title." });
        }

        const videoPath = req.file.path;
        const outFileName = `titled-video-${Date.now()}-${path.basename(videoPath)}`;
        const outPath = path.join(OUTPUT_DIR, outFileName);

        const options = {
            title: req.body.title as string,
            fontSize: req.body.fontSize ? Number(req.body.fontSize) : 72, // Ukuran font diperbesar
            fontColor: req.body.fontColor as string || "yellow",
//            position: req.body.position as string || "(w-text_w)/2:h-text_h-20", // Posisi di bawah
position: req.body.position as string || "(w-text_w)/2:10", 
            fadeDuration: req.body.fadeDuration ? Number(req.body.fadeDuration) : 0.5,
//            fontFile: "Arial",
        };
// console.log(`Jalur font yang digunakan: ${options.fontFile}`);
        await addTitleOverlay(videoPath, outPath, options);
        return res.json({ ok: true, url: `/uploads/output/${path.basename(outPath)}` });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
