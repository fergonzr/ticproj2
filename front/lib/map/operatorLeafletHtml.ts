/**
 * Operator map Leaflet HTML — web-only (loads Leaflet from CDN).
 *
 * postMessage protocol (JSON-stringified from React Native WebView):
 *   { type: "UPDATE_ALERTS",    alerts:    { id, lat, lng, label }[] }
 *   { type: "UPDATE_HOSPITALS", hospitals: { id, name, latitude, longitude }[] }
 *   { type: "UPDATE_PARAMEDICS",paramedics:{ id, name, location: { latitude, longitude } }[] }
 *   { type: "UPDATE_ROUTE",     points:    { latitude, longitude }[] | null }
 */
export const OPERATOR_LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([6.1700, -75.5973], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var alertMarkers = {};
  var hospitalMarkers = {};
  var paramedicMarkers = {};
  var routePolyline = null;

  function divIcon(html) {
    return L.divIcon({ html: html, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
  }

  function alertIcon(label) {
    return divIcon('<div style="background:#ef9f27;color:#633806;border:2px solid #ef9f27;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;">' + label + '</div>');
  }

  function hospitalIcon() {
    return divIcon('<div style="background:#185fa5;color:#fff;border:2px solid #185fa5;border-radius:4px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">H</div>');
  }

  function paramedicIcon() {
    return divIcon('<div style="background:#257985;color:#fff;border:2px solid #257985;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">P</div>');
  }

  function handleMsg(msg) {
    if (msg.type === 'UPDATE_ALERTS') {
      Object.keys(alertMarkers).forEach(function(id) {
        if (!msg.alerts.find(function(a) { return a.id === id; })) {
          map.removeLayer(alertMarkers[id]);
          delete alertMarkers[id];
        }
      });
      msg.alerts.forEach(function(a, i) {
        var label = a.label || ('A' + (i + 1));
        if (alertMarkers[a.id]) {
          alertMarkers[a.id].setLatLng([a.lat, a.lng]).setIcon(alertIcon(label));
        } else {
          alertMarkers[a.id] = L.marker([a.lat, a.lng], { icon: alertIcon(label) })
            .bindTooltip(label).addTo(map);
        }
      });

    } else if (msg.type === 'UPDATE_HOSPITALS') {
      Object.keys(hospitalMarkers).forEach(function(id) { map.removeLayer(hospitalMarkers[id]); delete hospitalMarkers[id]; });
      msg.hospitals.forEach(function(h) {
        hospitalMarkers[h.id] = L.marker([h.latitude, h.longitude], { icon: hospitalIcon() })
          .bindTooltip(h.name).addTo(map);
      });

    } else if (msg.type === 'UPDATE_PARAMEDICS') {
      Object.keys(paramedicMarkers).forEach(function(id) {
        if (!msg.paramedics.find(function(p) { return p.id === id; })) {
          map.removeLayer(paramedicMarkers[id]);
          delete paramedicMarkers[id];
        }
      });
      msg.paramedics.forEach(function(p) {
        var ll = [p.location.latitude, p.location.longitude];
        if (paramedicMarkers[p.id]) {
          paramedicMarkers[p.id].setLatLng(ll);
        } else {
          paramedicMarkers[p.id] = L.marker(ll, { icon: paramedicIcon() })
            .bindTooltip(p.name).addTo(map);
        }
      });

    } else if (msg.type === 'UPDATE_ROUTE') {
      if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
      if (msg.points && msg.points.length > 0) {
        var latlngs = msg.points.map(function(p) { return [p.latitude, p.longitude]; });
        routePolyline = L.polyline(latlngs, { color: '#257985', weight: 4, opacity: 0.85 }).addTo(map);
      }
    }
  }

  function onMsg(e) { try { handleMsg(JSON.parse(e.data)); } catch(err) {} }
  window.addEventListener('message', onMsg);
  document.addEventListener('message', onMsg);
</script>
</body>
</html>`;
