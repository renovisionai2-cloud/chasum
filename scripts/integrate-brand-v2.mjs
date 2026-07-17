/**
 * Brand V2 integration — reorganize public/brand-v2 and generate web assets.
 *
 * Target layout:
 *   brand-v2/
 *     svg/       web-ready SVGs
 *     png/       web-ready PNGs (lockups, light variants)
 *     favicon/   browser / PWA icons
 *     social/    Open Graph
 *     source/    masters (AI, PDF, EPS, PSD, original SVG/PNG)
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const V2 = path.join(ROOT, "public/brand-v2");
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "app");

const DIRS = {
  svg: path.join(V2, "svg"),
  png: path.join(V2, "png"),
  favicon: path.join(V2, "favicon"),
  social: path.join(V2, "social"),
  source: path.join(V2, "source"),
  sourceSvg: path.join(V2, "source", "SVG"),
  sourcePng: path.join(V2, "source", "PNG"),
  sourceEps: path.join(V2, "source", "EPS"),
  sourcePsd: path.join(V2, "source", "PSD"),
};

function ensureDirs(keys) {
  for (const key of keys) fs.mkdirSync(DIRS[key], { recursive: true });
}

function moveIfExists(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(src, dest);
  return true;
}

function uniquifySvgIds(svg, prefix) {
  return svg
    .replace(/id="SVGID_(\d+_)"/g, `id="${prefix}$1"`)
    .replace(/url\(#SVGID_(\d+_)"\)/g, `url(#${prefix}$1")`)
    .replace(/url\(#SVGID_(\d+_)\)/g, `url(#${prefix}$1)`);
}

function cleanOfficialSvg(raw, prefix) {
  let svg = uniquifySvgIds(raw, prefix);
  if (!/viewBox=/.test(svg) && /width="1200px"/.test(svg)) {
    svg = svg.replace(
      /width="1200px"\s+height="1200px"/,
      'width="1200" height="1200" viewBox="0 0 1200 1200"',
    );
  }
  return svg;
}

function writeWebSvg(srcName, destName, prefix) {
  const src = path.join(DIRS.sourceSvg, srcName);
  const dest = path.join(DIRS.svg, destName);
  const raw = fs.readFileSync(src, "utf8");
  fs.writeFileSync(dest, cleanOfficialSvg(raw, prefix));
  console.log("svg →", destName);
}

/** Minimal multi-size ICO from PNG buffers. */
function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  function pngSize(buf) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
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

async function toLightInk(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Preserve vivid blue/purple accents (A-dot, C Mark gradient)
    const isAccent = b > 140 && b > r + 40 && b > g;
    if (isAccent) continue;
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function main() {
  // 1) Reorganize masters into source/ BEFORE creating lowercase svg/png
  //    (macOS APFS is case-insensitive — SVG and svg collide)
  ensureDirs(["source", "sourceSvg", "sourcePng", "sourceEps", "sourcePsd", "favicon", "social"]);

  moveIfExists(path.join(V2, "SVG"), DIRS.sourceSvg);
  moveIfExists(path.join(V2, "PNG"), DIRS.sourcePng);
  moveIfExists(path.join(V2, "EPS"), DIRS.sourceEps);
  moveIfExists(path.join(V2, "PSD"), DIRS.sourcePsd);
  moveIfExists(path.join(V2, "CHASUM.ai"), path.join(DIRS.source, "CHASUM.ai"));
  moveIfExists(path.join(V2, "CHASUM.ai.ps"), path.join(DIRS.source, "CHASUM.ai.ps"));
  moveIfExists(path.join(V2, "CHASUM.pdf"), path.join(DIRS.source, "CHASUM.pdf"));

  if (!fs.existsSync(path.join(DIRS.sourceSvg, "CHASUM_Logo icon.svg"))) {
    throw new Error("Brand V2 source SVG masters missing under public/brand-v2/source/SVG");
  }

  // Now safe to create web-facing lowercase folders
  ensureDirs(["svg", "png"]);

  // Prefer existing top-level favicons if present, else regenerate later
  const legacyFav16 = path.join(V2, "favicon-16x16.png");
  const legacyFav32 = path.join(V2, "favicon-32x32.png");
  const legacyFavIco = path.join(V2, "favicon.ico");

  // 2) Web SVGs from official masters
  writeWebSvg("CHASUM_Logo icon.svg", "logo-icon.svg", "cmark-");
  writeWebSvg("CHASUM_Logo icon.svg", "favicon.svg", "fav-");
  writeWebSvg("CHASUM_Spark.svg", "spark.svg", "spark-");
  writeWebSvg("CHASUM_Wordmark.svg", "wordmark.svg", "wm-");
  writeWebSvg(
    "CHASUM_Full-color master logo.svg",
    "logo-full.svg",
    "full-",
  );

  // Light wordmark SVG (ink → white; keep blue A-dot fills if present as hex)
  const wordmarkSvg = fs.readFileSync(path.join(DIRS.svg, "wordmark.svg"), "utf8");
  const wordmarkLightSvg = wordmarkSvg
    .replace(/fill="#0[Bb]1324"/g, 'fill="#FFFFFF"')
    .replace(/fill="#081324"/g, 'fill="#FFFFFF"')
    .replace(/fill="#334155"/g, 'fill="#E8EEF5"')
    .replace(/fill="#1[Ee]293[Bb]"/g, 'fill="#FFFFFF"')
    .replace(/fill="#0F172A"/g, 'fill="#FFFFFF"');
  fs.writeFileSync(path.join(DIRS.svg, "wordmark-light.svg"), wordmarkLightSvg);
  console.log("svg → wordmark-light.svg");

  const fullSvg = fs.readFileSync(path.join(DIRS.svg, "logo-full.svg"), "utf8");
  const fullLightSvg = fullSvg
    .replace(/fill="#0[Bb]1324"/g, 'fill="#FFFFFF"')
    .replace(/fill="#081324"/g, 'fill="#FFFFFF"')
    .replace(/fill="#334155"/g, 'fill="#E8EEF5"')
    .replace(/fill="#1[Ee]293[Bb]"/g, 'fill="#FFFFFF"')
    .replace(/fill="#0F172A"/g, 'fill="#FFFFFF"');
  fs.writeFileSync(path.join(DIRS.svg, "logo-full-light.svg"), fullLightSvg);
  console.log("svg → logo-full-light.svg");

  // 3) Trimmed PNG masters for composition
  const iconMaster = path.join(DIRS.sourcePng, "CHASUM_Logo icon.png");
  const wordmarkMaster = path.join(DIRS.sourcePng, "CHASUM_Wordmark.png");
  const fullMaster = path.join(DIRS.sourcePng, "CHASUM_Full-color master logo.png");
  const sparkMaster = path.join(DIRS.sourcePng, "CHASUM_Spark.png");

  const iconPng = await sharp(iconMaster)
    .trim()
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(iconPng).toFile(path.join(DIRS.png, "logo-icon.png"));
  console.log("png → logo-icon.png");

  const sparkPng = await sharp(sparkMaster)
    .trim()
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(sparkPng).toFile(path.join(DIRS.png, "spark.png"));
  console.log("png → spark.png");

  const wmFull = await sharp(wordmarkMaster).trim().png().toBuffer();
  const wmMeta = await sharp(wmFull).metadata();
  // Gap between name and tagline (from prior audit ~y=640 on 1032)
  const { data, info } = await sharp(wmFull)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const rowCounts = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    let c = 0;
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) c++;
    }
    rowCounts[y] = c;
  }
  let nameEnd = Math.round(h * 0.62);
  let inContent = false;
  for (let y = 0; y < h; y++) {
    const dense = rowCounts[y] > w * 0.02;
    if (dense) inContent = true;
    if (inContent && !dense) {
      let end = y;
      while (end < h && rowCounts[end] <= w * 0.02) end++;
      if (end < h && end - y > 8) {
        nameEnd = y;
        break;
      }
    }
  }

  const wmName = await sharp(wmFull)
    .extract({ left: 0, top: 0, width: wmMeta.width, height: nameEnd })
    .trim()
    .png()
    .toBuffer();
  await sharp(wmName).toFile(path.join(DIRS.png, "wordmark.png"));
  await sharp(wmFull)
    .resize({ width: 1200, fit: "inside" })
    .toFile(path.join(DIRS.png, "wordmark-tagline.png"));
  await toLightInk(wmName).then((b) =>
    sharp(b).toFile(path.join(DIRS.png, "wordmark-light.png")),
  );
  await toLightInk(
    await sharp(wmFull).resize({ width: 1200, fit: "inside" }).png().toBuffer(),
  ).then((b) =>
    sharp(b).toFile(path.join(DIRS.png, "wordmark-tagline-light.png")),
  );
  console.log("png → wordmark (+ light / tagline)");

  // Full lockup from official master
  await sharp(fullMaster)
    .trim()
    .resize({ width: 1200, fit: "inside" })
    .png()
    .toFile(path.join(DIRS.png, "logo-full.png"));
  await toLightInk(
    await sharp(path.join(DIRS.png, "logo-full.png")).png().toBuffer(),
  ).then((b) => sharp(b).toFile(path.join(DIRS.png, "logo-full-light.png")));
  console.log("png → logo-full (+ light)");

  // Horizontal = icon + name-only
  async function makeHorizontal(wmBuf, outName) {
    const icon = await sharp(iconPng)
      .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const wm = await sharp(wmBuf).resize({ height: 72, fit: "inside" }).png().toBuffer();
    const m = await sharp(wm).metadata();
    const gap = 20;
    const width = 128 + gap + (m.width || 300);
    await sharp({
      create: {
        width,
        height: 128,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: icon, left: 0, top: 0 },
        {
          input: wm,
          left: 128 + gap,
          top: Math.round((128 - (m.height || 72)) / 2),
        },
      ])
      .png()
      .toFile(path.join(DIRS.png, outName));
    console.log("png →", outName);
  }
  await makeHorizontal(wmName, "logo-horizontal.png");
  await makeHorizontal(
    await sharp(path.join(DIRS.png, "wordmark-light.png")).png().toBuffer(),
    "logo-horizontal-light.png",
  );

  // App / manifest icons
  await sharp(iconPng)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(DIRS.png, "app-icon-1024.png"));
  await sharp(iconPng)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 241, g: 245, b: 249, alpha: 1 },
    })
    .png()
    .toFile(path.join(DIRS.favicon, "manifest-icon.png"));
  console.log("png → app-icon-1024 / manifest-icon");

  // 4) Favicon package
  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192x192.png", size: 192 },
    { name: "android-chrome-512x512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    // Prefer pack-provided 16/32 if present and matching size
    const legacy =
      size === 16 && fs.existsSync(legacyFav16)
        ? legacyFav16
        : size === 32 && fs.existsSync(legacyFav32)
          ? legacyFav32
          : null;
    if (legacy) {
      fs.copyFileSync(legacy, path.join(DIRS.favicon, name));
    } else {
      const bg =
        size >= 180
          ? { r: 241, g: 245, b: 249, alpha: 1 }
          : { r: 0, g: 0, b: 0, alpha: 0 };
      await sharp(iconPng)
        .resize(size, size, { fit: "contain", background: bg })
        .png()
        .toFile(path.join(DIRS.favicon, name));
    }
    console.log("favicon →", name);
  }

  // favicon.ico
  if (fs.existsSync(legacyFavIco)) {
    fs.copyFileSync(legacyFavIco, path.join(DIRS.favicon, "favicon.ico"));
  } else {
    const ico16 = await sharp(path.join(DIRS.favicon, "favicon-16x16.png"))
      .png()
      .toBuffer();
    const ico32 = await sharp(path.join(DIRS.favicon, "favicon-32x32.png"))
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(DIRS.favicon, "favicon.ico"), encodeIco([ico16, ico32]));
  }
  // Also copy cleaned SVG favicon
  fs.copyFileSync(
    path.join(DIRS.svg, "favicon.svg"),
    path.join(DIRS.favicon, "favicon.svg"),
  );
  console.log("favicon → favicon.ico + favicon.svg");

  // Cleanup loose top-level favicons after move into favicon/
  for (const f of [legacyFav16, legacyFav32, legacyFavIco]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  // 5) Open Graph
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
  const ogLockup = await sharp(path.join(DIRS.png, "logo-full-light.png"))
    .resize({ width: 780, fit: "inside" })
    .png()
    .toBuffer();
  const ogMeta = await sharp(ogLockup).metadata();
  await sharp(gradientSvg)
    .composite([
      {
        input: ogLockup,
        left: Math.round((ogW - (ogMeta.width ?? 780)) / 2),
        top: Math.round((ogH - (ogMeta.height ?? 200)) / 2),
      },
    ])
    .png()
    .toFile(path.join(DIRS.social, "og-image.png"));
  console.log("social → og-image.png");

  // 6) App Router icons (Next.js convention — keep in sync with brand-v2)
  fs.copyFileSync(
    path.join(DIRS.favicon, "favicon.ico"),
    path.join(APP, "favicon.ico"),
  );
  fs.copyFileSync(
    path.join(DIRS.favicon, "apple-touch-icon.png"),
    path.join(APP, "apple-icon.png"),
  );
  fs.copyFileSync(
    path.join(DIRS.favicon, "android-chrome-192x192.png"),
    path.join(APP, "icon.png"),
  );
  console.log("app → favicon.ico / icon.png / apple-icon.png");

  // Manifest at brand-v2 root for convenience
  const manifest = {
    name: "Chasum",
    short_name: "Chasum",
    description: "AI Business Operating System for service businesses.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/brand-v2/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand-v2/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand-v2/favicon/manifest-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand-v2/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand-v2/svg/logo-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand-v2/png/app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
  fs.writeFileSync(
    path.join(V2, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(PUBLIC, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log("manifest → brand-v2/site.webmanifest + public/site.webmanifest");

  console.log("\nBrand V2 integration assets ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
