/**
 * Builds a self-contained HTML document (suitable for iframe srcDoc) that
 * renders a Leaflet heatmap over Envigado using circleMarkers.
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
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var points = ${pointsJson};
  var map = L.map('map', { zoomControl: false, attributionControl: false })
    .setView([6.1700, -75.5890], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);
  L.control.zoom({ position: 'topright' }).addTo(map);
  points.forEach(function(p) {
    var lat = p[0], lng = p[1], intensity = p[2];
    var hue = 30 + (1 - intensity) * 60;
    L.circleMarker([lat, lng], {
      radius: intensity * 26 + 8,
      fillColor: 'oklch(0.65 0.2 ' + hue + ')',
      fillOpacity: 0.35 + intensity * 0.3,
      stroke: false,
    }).addTo(map);
  });
  setTimeout(function() { map.invalidateSize(); }, 100);
<\/script>
</body>
</html>`;
}
