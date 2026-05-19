/**
 * Builds a self-contained HTML document (suitable for iframe srcDoc) that
 * renders a Leaflet heatmap over Envigado using the leaflet.heat plugin
 * on top of OpenStreetMap tiles.
 *
 * Points are anonymised aggregate locations — no citizen-identifiable data.
 * postMessage is not required; the map is purely visual / read-only.
 */
export function buildHeatmapHtml(
  points: [number, number, number][],
): string {
  const pointsJson = JSON.stringify(points);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; }
    .leaflet-control-attribution { font-size: 10px; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var points = ${pointsJson};
  var map = L.map('map', { zoomControl: false })
    .setView([6.1700, -75.5890], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.heatLayer(points, {
    radius: 30,
    blur: 25,
    maxZoom: 17,
    minOpacity: 0.35,
    gradient: { 0.2: '#43a047', 0.5: '#fbc02d', 0.8: '#fb8c00', 1.0: '#e53935' }
  }).addTo(map);
  setTimeout(function() { map.invalidateSize(); }, 100);
<\/script>
</body>
</html>`;
}
