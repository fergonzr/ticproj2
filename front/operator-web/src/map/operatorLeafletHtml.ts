/**
 * Operator map Leaflet HTML — web-only (loads Leaflet from CDN).
 *
 * postMessage protocol (JSON-stringified):
 *   { type: "UPDATE_ALERTS",    alerts:    { id, lat, lng, name, status, triage }[] }
 *   { type: "UPDATE_HOSPITALS", hospitals: { id, name, latitude, longitude }[] }
 *   { type: "UPDATE_PARAMEDICS",paramedics:{ id, name, location: { latitude, longitude } }[] }
 *   { type: "UPDATE_ROUTE",     points:    { latitude, longitude }[] | null }
 *   { type: "ZOOM_TO",          id: string }
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
    .leaflet-tooltip {
      font-size: 12px;
      font-family: sans-serif;
      white-space: nowrap;
    }
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
  var alertData = {};
  var hospitalMarkers = {};
  var paramedicMarkers = {};
  var routePolyline = null;

  function divIcon(html, size) {
    size = size || 32;
    return L.divIcon({ html: html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
  }

  function alertColor(status, triage) {
    if (status === 'CLOSED' || status === 'CANCELED') {
      return { bg: '#e0e0e0', border: '#9e9e9e', text: '#616161' };
    }
    if (!triage) {
      return { bg: '#9e9e9e', border: '#757575', text: '#fff' };
    }
    var critical = triage.bleeding || triage.dizziness || triage.blurred_vision ||
                   triage.unconscious || triage.difficulty_breathing ||
                   triage.fracture || triage.chest_pain || triage.numbness_limbs;
    if (critical) {
      return { bg: '#e53935', border: '#b71c1c', text: '#fff' };
    }
    return { bg: '#43a047', border: '#2e7d32', text: '#fff' };
  }

  function alertIcon(status, triage, index) {
    var c = alertColor(status, triage);
    var label = 'A' + index;
    return divIcon(
      '<div style="background:' + c.bg + ';color:' + c.text + ';border:2px solid ' + c.border +
      ';border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">' +
      label + '</div>'
    );
  }

  function hospitalIcon() {
    return divIcon(
      '<div style="background:#185fa5;color:#fff;border:2px solid #0d3c6e;border-radius:4px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">H</div>'
    );
  }

  function paramedicIcon() {
    return divIcon(
      '<div style="background:#257985;color:#fff;border:2px solid #17535c;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>'
    );
  }

  function coordLabel(lat, lng) {
    return lat.toFixed(5) + ', ' + lng.toFixed(5);
  }

  function alertTooltip(name, lat, lng) {
    return '<b>' + name + '</b><br><span style="color:#555">' + coordLabel(lat, lng) + '</span>';
  }

  function paramedicTooltip(name, lat, lng) {
    return '<b>' + name + '</b><br><span style="color:#555">' + coordLabel(lat, lng) + '</span>';
  }

  function handleMsg(msg) {
    if (msg.type === 'UPDATE_ALERTS') {
      var ids = msg.alerts.map(function(a) { return a.id; });
      Object.keys(alertMarkers).forEach(function(id) {
        if (ids.indexOf(id) === -1) {
          map.removeLayer(alertMarkers[id]);
          delete alertMarkers[id];
          delete alertData[id];
        }
      });
      msg.alerts.forEach(function(a, i) {
        alertData[a.id] = a;
        var icon = alertIcon(a.status, a.triage, i + 1);
        var name = a.name || 'Paciente desconocido';
        var tip = alertTooltip(name, a.lat, a.lng);
        if (alertMarkers[a.id]) {
          alertMarkers[a.id].setLatLng([a.lat, a.lng]).setIcon(icon);
          alertMarkers[a.id].setTooltipContent(tip);
        } else {
          (function(id) {
            alertMarkers[id] = L.marker([a.lat, a.lng], { icon: icon })
              .bindTooltip(tip, { sticky: true, direction: 'top', offset: [0, -8] })
              .on('click', function() {
                window.parent.postMessage(JSON.stringify({ type: 'ALERT_CLICKED', id: id }), '*');
              })
              .addTo(map);
          })(a.id);
        }
      });

    } else if (msg.type === 'UPDATE_HOSPITALS') {
      Object.keys(hospitalMarkers).forEach(function(id) { map.removeLayer(hospitalMarkers[id]); delete hospitalMarkers[id]; });
      msg.hospitals.forEach(function(h) {
        hospitalMarkers[h.id] = L.marker([h.latitude, h.longitude], { icon: hospitalIcon() })
          .bindTooltip('<b>' + h.name + '</b>', { sticky: true, direction: 'top', offset: [0, -8] })
          .addTo(map);
      });

    } else if (msg.type === 'UPDATE_PARAMEDICS') {
      var ids = msg.paramedics.map(function(p) { return p.id; });
      Object.keys(paramedicMarkers).forEach(function(id) {
        if (ids.indexOf(id) === -1) {
          map.removeLayer(paramedicMarkers[id]);
          delete paramedicMarkers[id];
        }
      });
      msg.paramedics.forEach(function(p) {
        var ll = [p.location.latitude, p.location.longitude];
        var tip = paramedicTooltip(p.name, p.location.latitude, p.location.longitude);
        if (paramedicMarkers[p.id]) {
          paramedicMarkers[p.id].setLatLng(ll);
          paramedicMarkers[p.id].setTooltipContent(tip);
        } else {
          paramedicMarkers[p.id] = L.marker(ll, { icon: paramedicIcon() })
            .bindTooltip(tip, { sticky: true, direction: 'top', offset: [0, -8] })
            .addTo(map);
        }
      });

    } else if (msg.type === 'UPDATE_ROUTE') {
      if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
      if (msg.points && msg.points.length > 0) {
        var latlngs = msg.points.map(function(p) { return [p.latitude, p.longitude]; });
        routePolyline = L.polyline(latlngs, { color: '#257985', weight: 4, opacity: 0.85 }).addTo(map);
      }

    } else if (msg.type === 'ZOOM_TO') {
      var marker = alertMarkers[msg.id];
      if (marker) {
        map.flyTo(marker.getLatLng(), 17, { animate: true, duration: 0.8 });
      }
    }
  }

  function onMsg(e) { try { handleMsg(JSON.parse(e.data)); } catch(err) {} }
  window.addEventListener('message', onMsg);
  document.addEventListener('message', onMsg);

  window.parent.postMessage(JSON.stringify({ type: 'MAP_READY' }), '*');
</script>
</body>
</html>`;
