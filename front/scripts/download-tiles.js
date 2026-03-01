/**
 * Downloads OpenStreetMap tiles for the Envigado area.
 * Run once: node scripts/download-tiles.js
 * Requires internet. The downloaded tiles are committed to the repo.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Envigado bounding box (slightly padded)
const BOUNDS = {
  minLat: 6.15,
  maxLat: 6.19,
  minLon: -75.61,
  maxLon: -75.57,
};

const ZOOM_LEVELS = [13, 14, 15, 16];
const OUTPUT_DIR = path.join(__dirname, "..", "assets", "map-tiles");

function latLonToTile(lat, lon, z) {
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

function downloadTile(z, x, y) {
  return new Promise((resolve, reject) => {
    const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    const dir = path.join(OUTPUT_DIR, String(z), String(x));
    const filePath = path.join(dir, `${y}.png`);

    if (fs.existsSync(filePath)) {
      resolve(false);
      return;
    }

    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(filePath);
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "SIEE-App-TileDownloader/1.0 (university project)",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            file.close();
            fs.unlinkSync(filePath);
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve(true);
          });
        }
      )
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(err);
      });
  });
}

async function main() {
  let totalTiles = 0;
  let downloaded = 0;

  for (const z of ZOOM_LEVELS) {
    const topLeft = latLonToTile(BOUNDS.maxLat, BOUNDS.minLon, z);
    const bottomRight = latLonToTile(BOUNDS.minLat, BOUNDS.maxLon, z);

    const minX = topLeft.x;
    const maxX = bottomRight.x;
    const minY = topLeft.y;
    const maxY = bottomRight.y;

    const count = (maxX - minX + 1) * (maxY - minY + 1);
    totalTiles += count;
    console.log(`Zoom ${z}: ${count} tiles (x: ${minX}-${maxX}, y: ${minY}-${maxY})`);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        try {
          const wasNew = await downloadTile(z, x, y);
          if (wasNew) downloaded++;
          // Respect OSM tile usage policy: max 2 requests/sec
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          console.error(`Failed: z=${z} x=${x} y=${y}: ${err.message}`);
        }
      }
    }
  }

  console.log(`\nDone. ${downloaded} new tiles downloaded (${totalTiles} total).`);
  console.log(`Tiles saved to: ${OUTPUT_DIR}`);
}

main();
