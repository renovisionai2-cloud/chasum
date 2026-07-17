/**
 * Integrate official Chasum brand pack into web-facing assets.
 * Source: public/brand/SVG + public/brand/PNG
 * Does not redesign — copies/cleans official artwork and generates icon package.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const BRAND = path.join(ROOT, "public/brand");
const PUBLIC = path.join(ROOT, "public");
const SVG = path.join(BRAND, "SVG");
const PNG = path.join(BRAND, "PNG");

function uniquifySvgIds(svg, prefix) {
  return svg
    .replace(/id="SVGID_(\d+_)"/g, `id="${prefix}$1"`)
    .replace(/url\(#SVGID_(\d+_)"\)/g, `url(#${prefix}$1")`)
    .replace(/url\(#SVGID_(\d+_)\)/g, `url(#${prefix}$1)`);
}

function cleanOfficialSvg(raw, prefix) {
  let svg = uniquifySvgIds(raw, prefix);
  // Prefer viewBox for responsive scaling
  if (!/viewBox=/.test(svg) && /width="1200px"/.test(svg)) {
    svg = svg.replace(
      /width="1200px"\s+height="1200px"/,
      'width="1200" height="1200" viewBox="0 0 1200 1200"',
    );
  }
  return svg;
}

function writeOfficialSvg(srcName, destName, prefix) {
  const src = path.join(SVG, srcName);
  const dest = path.join(BRAND, destName);
  const raw = fs.readFileSync(src, "utf8");
  fs.writeFileSync(dest, cleanOfficialSvg(raw, prefix));
  console.log("svg →", destName);
}

/** Minimal multi-size ICO from PNG buffers (PNG-compressed ICONDIRENTRY). */
function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];
  for (const buf of pngBuffers) {
    const meta = sharp(buf); // not used; sizes from sharp metadata below
    entries.push({ buf, offset });
    offset += buf.length;
  }
  // We need width/height — parse IHDR from PNG
  function pngSize(buf) {
    // IHDR starts at byte 16: width u32, height u32
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let o = 6;
  let dataOffset = headerSize;
  const parts = [header];
  for (const buf of pngBuffers) {
    const { w, h } = pngSize(buf);
    header.writeUInt8(w >= 256 ? 0 : w, o);
    header.writeUInt8(h >= 256 ? 0 : h, o + 1);
    header.writeUInt8(0, o + 2);
    header.writeUInt8(0, o + 3);
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(buf.length, o + 8);
    header.writeUInt32LE(dataOffset, o + 12);
    o += 16;
    dataOffset += buf.length;
    parts.push(buf);
  }
  return Buffer.concat(parts);
}

async function main() {
  // 1) Official SVG web assets
  writeOfficialSvg("CHASUM_Logo icon.svg", "logo-icon.svg", "cmark-");
  writeOfficialSvg("CHASUM_Logo icon.svg", "favicon.svg", "fav-");
  writeOfficialSvg("CHASUM_Logo icon.svg", "icon.svg", "icon-");
  writeOfficialSvg("CHASUM_Logo icon.svg", "logo.svg", "logo-");
  writeOfficialSvg("CHASUM_Spark.svg", "spark.svg", "spark-");
  writeOfficialSvg("CHASUM_Wordmark.svg", "wordmark.svg", "wm-");
  writeOfficialSvg("CHASUM_Wordmark.svg", "wordmark-name.svg", "wmn-");
  writeOfficialSvg(
    "CHASUM_Full-color master logo.svg",
    "logo-full.svg",
    "full-",
  );

  // Light wordmark: swap dark ink for white (official has no light pack)
  const wordmark = fs.readFileSync(path.join(BRAND, "wordmark.svg"), "utf8");
  const wordmarkLight = wordmark
    .replace(/#020D29/gi, "#FFFFFF")
    .replace(/cmark-|wm-|wmn-/g, "wml-");
  // Fix ids after blind replace — re-read and rebuild
  const wmRaw = fs.readFileSync(path.join(SVG, "CHASUM_Wordmark.svg"), "utf8");
  fs.writeFileSync(
    path.join(BRAND, "wordmark-light.svg"),
    cleanOfficialSvg(wmRaw, "wml-").replace(/#020D29/gi, "#FFFFFF"),
  );
  fs.writeFileSync(
    path.join(BRAND, "wordmark-name-light.svg"),
    cleanOfficialSvg(wmRaw, "wmnl-").replace(/#020D29/gi, "#FFFFFF"),
  );
  console.log("svg → wordmark-light.svg");

  // Light icon: keep color icon (same artwork) — logo-light was mono; use official color
  fs.copyFileSync(
    path.join(BRAND, "logo-icon.svg"),
    path.join(BRAND, "logo-light.svg"),
  );
  fs.copyFileSync(
    path.join(BRAND, "logo-icon.svg"),
    path.join(BRAND, "logo-dark.svg"),
  );

  // Horizontal / stacked lockups: use official full master as source of truth
  // for marketing full lockup; keep horizontal as composed via Logo component
  // For horizontal SVG file used by Logo Image src — generate from master crop isn't trivial.
  // Prefer official full for withTagline; for horizontal use PNG composition via sharp.

  const iconPng = path.join(PNG, "CHASUM_Logo icon.png");
  const masterPng = path.join(PNG, "CHASUM_Full-color master logo.png");
  const wordmarkPng = path.join(PNG, "CHASUM_Wordmark.png");

  // 2) App / touch / manifest icons from official logo icon
  const iconSource = sharp(iconPng).ensureAlpha();
  const sizes = [
    { name: "favicon-16x16.png", size: 16, dest: path.join(PUBLIC, "favicon-16x16.png") },
    { name: "favicon-32x32.png", size: 32, dest: path.join(PUBLIC, "favicon-32x32.png") },
    { name: "apple-touch-icon.png", size: 180, dest: path.join(PUBLIC, "apple-touch-icon.png") },
    { name: "android-chrome-192x192.png", size: 192, dest: path.join(PUBLIC, "android-chrome-192x192.png") },
    { name: "android-chrome-512x512.png", size: 512, dest: path.join(PUBLIC, "android-chrome-512x512.png") },
  ];

  for (const { name, size, dest } of sizes) {
    await sharp(iconPng)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(dest);
    console.log("png →", name);
  }

  // Also write brand/ copies used by existing BRAND_ASSETS
  await sharp(iconPng)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(BRAND, "apple-touch-icon.png"));
  await sharp(iconPng)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(BRAND, "manifest-icon.png"));
  await sharp(iconPng)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(BRAND, "app-icon-1024.png"));
  console.log("png → brand apple/manifest/app icons");

  // favicon.ico (16 + 32)
  const ico16 = await sharp(iconPng)
    .resize(16, 16, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const ico32 = await sharp(iconPng)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), encodeIco([ico16, ico32]));
  console.log("ico → favicon.ico");

  // 3) Horizontal lockup PNG for Logo component reliability (SVG horizontal was rebuilt)
  // Compose icon + wordmark on transparent canvas for nav use
  const iconBuf = await sharp(iconPng)
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  // Wordmark is 1200 canvas — trim
  const wmBuf = await sharp(wordmarkPng)
    .trim()
    .resize({ height: 72, fit: "inside" })
    .png()
    .toBuffer();
  const wmMeta = await sharp(wmBuf).metadata();
  const hPad = 24;
  const canvasW = 128 + hPad + (wmMeta.width ?? 320);
  const canvasH = 128;
  const composed = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: iconBuf, left: 0, top: 0 },
      {
        input: wmBuf,
        left: 128 + hPad,
        top: Math.round((canvasH - (wmMeta.height ?? 72)) / 2),
      },
    ])
    .png()
    .toFile(path.join(BRAND, "logo-horizontal.png"));
  console.log("png → logo-horizontal.png");

  // Light horizontal: white wordmark
  const wmLightBuf = await sharp(wmBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(async ({ data, info }) => {
      // Recolor dark pixels to white via SVG overlay approach — simpler: use wordmark light SVG rasterized
      return sharp(path.join(BRAND, "wordmark-light.svg"))
        .resize({ height: 72, fit: "inside" })
        .png()
        .toBuffer();
    });
  const wmLightMeta = await sharp(wmLightBuf).metadata();
  await sharp({
    create: {
      width: 128 + hPad + (wmLightMeta.width ?? 320),
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: iconBuf, left: 0, top: 0 },
      {
        input: wmLightBuf,
        left: 128 + hPad,
        top: Math.round((canvasH - (wmLightMeta.height ?? 72)) / 2),
      },
    ])
    .png()
    .toFile(path.join(BRAND, "logo-horizontal-light.png"));
  console.log("png → logo-horizontal-light.png");

  // Keep SVG horizontal pointing to composed look: also copy master as logo-full.png
  await sharp(masterPng)
    .trim()
    .resize({ width: 1200, fit: "inside" })
    .png()
    .toFile(path.join(BRAND, "logo-full.png"));
  console.log("png → logo-full.png");

  // 4) Open Graph image 1200×630
  const ogW = 1200;
  const ogH = 630;
  const gradientSvg = Buffer.from(`
    <svg width="${ogW}" height="${ogH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E40AF"/>
          <stop offset="45%" stop-color="#2563EB"/>
          <stop offset="100%" stop-color="#7C3AED"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="1080" cy="80" r="220" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="120" cy="560" r="180" fill="#ffffff" fill-opacity="0.05"/>
    </svg>
  `);

  // Official full lockup (light) centered — logo + CHASUM + tagline, no extra text
  const ogLockup = await sharp(path.join(BRAND, "logo-full-light.png"))
    .resize({ width: 780, fit: "inside" })
    .png()
    .toBuffer();
  const ogMeta = await sharp(ogLockup).metadata();
  const ogLeft = Math.round((ogW - (ogMeta.width ?? 780)) / 2);
  const ogTop = Math.round((ogH - (ogMeta.height ?? 200)) / 2);

  await sharp(gradientSvg)
    .composite([{ input: ogLockup, left: ogLeft, top: ogTop }])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"));
  console.log("png → og-image.png");

  console.log("Brand integration assets ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
