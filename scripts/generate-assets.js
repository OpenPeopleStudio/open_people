#!/usr/bin/env node

/**
 * Rasterize public/favicon.svg into the PNG/ICO set.
 * Source of truth is the SVG (void field, plasma chassis).
 *
 * Usage: npm run generate-assets
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const SVG_PATH = path.join(PUBLIC_DIR, "favicon.svg");

const PNG_SIZES = [
  { file: "favicon-16x16.png", size: 16 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "favicon-48x48.png", size: 48 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "android-chrome-192x192.png", size: 192 },
  { file: "android-chrome-512x512.png", size: 512 },
];

function encodeIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + 16 * count;
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((img) => img.png)]);
}

async function raster(size) {
  const svg = fs.readFileSync(SVG_PATH);
  return sharp(svg, { density: Math.max(72, size * 3) })
    .resize(size, size, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    throw new Error(`missing ${SVG_PATH}`);
  }
  console.log("Generating favicons from public/favicon.svg");

  const icoFrames = [];
  for (const { file, size } of PNG_SIZES) {
    const png = await raster(size);
    fs.writeFileSync(path.join(PUBLIC_DIR, file), png);
    console.log(`  ${file} (${size}×${size})`);
    if (size === 16 || size === 32 || size === 48) {
      icoFrames.push({ width: size, height: size, png });
    }
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), encodeIco(icoFrames));
  console.log("  favicon.ico (16/32/48)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
