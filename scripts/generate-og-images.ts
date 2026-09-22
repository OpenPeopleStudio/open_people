import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { DESK_OG } from "../lib/og/copy";
import { deskOgImage } from "../lib/og/image";
import { deskOgSvg } from "../lib/og/svg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = resolve(ROOT, "public");

async function writePng(png: Buffer, dest: string) {
  if (png.byteLength < 8_000) {
    throw new Error(`${dest} generated too small (${png.byteLength} bytes)`);
  }
  const meta = await sharp(png).metadata();
  if (meta.width !== 1200 || meta.height !== 630) {
    throw new Error(`${dest} is ${meta.width}×${meta.height}, expected 1200×630`);
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, png);
  return png.byteLength;
}

async function main() {
  writeFileSync(resolve(PUBLIC, "og-image.svg"), deskOgSvg(DESK_OG.home));
  const png = Buffer.from(await deskOgImage(DESK_OG.home).arrayBuffer());
  const ogBytes = await writePng(png, resolve(PUBLIC, "og-image.png"));
  const twBytes = await writePng(png, resolve(PUBLIC, "twitter-image.png"));
  console.log(`og-image.png ${ogBytes} bytes`);
  console.log(`twitter-image.png ${twBytes} bytes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
