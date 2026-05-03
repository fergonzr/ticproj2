"""
Seed script for Emergency Management System — MongoDB
Generates realistic fake data for the Valle de Aburrá region (Medellín, Colombia).

Usage:
  # Generate JSON files only (no DB connection needed):
  python seed_data.py --json-only

  # Insert directly into MongoDB:
  python seed_data.py --mongo-uri "mongodb://localhost:27017" --db emergencies

  # Custom count:
  python seed_data.py --json-only --count 500
"""

import argparse
import json
import random
import math
from datetime import datetime, timedelta
from typing import Any

# ── Constants ────────────────────────────────────────────────────────────────

STATUSES = ["CANCELED", "CLOSED", "IN_TRANSFER", "ON_SITE"]
STATUS_WEIGHTS = [0.05, 0.70, 0.15, 0.10]  # most emergencies end up CLOSED

TIMELINE_STAGES = [
    "RECEIVED",
    "TRIAGED",
    "PENDING_ASSIGNMENT",
    "ASSIGNED",
    "EN_ROUTE",
    "ON_SITE",
    "IN_TRANSFER",
    "AT_HOSPITAL",
    "CLOSED",
]

TRIAGE_VARIANTS = ["critical", "urgent", "light", "stable"]
TRIAGE_WEIGHTS  = [0.10, 0.25, 0.40, 0.25]

DELIVERY_VARIANTS = ["delivered", "onsite", "cancelled"]
DELIVERY_WEIGHTS  = [0.75, 0.15, 0.10]

# ── Valle de Aburrá locations ────────────────────────────────────────────────
# Each: (name, center_lat, center_lng, radius_km)
# Radius is used to scatter points realistically within each municipality.

LOCATIONS = [
    ("Medellín — El Poblado",      6.2086, -75.5659, 1.2),
    ("Medellín — Laureles",        6.2518, -75.5977, 0.8),
    ("Medellín — Centro",          6.2442, -75.5736, 0.6),
    ("Medellín — Belén",           6.2310, -75.5880, 0.9),
    ("Medellín — Robledo",         6.2750, -75.5900, 0.7),
    ("Medellín — Castilla",        6.2880, -75.5700, 0.5),
    ("Medellín — Buenos Aires",    6.2350, -75.5550, 0.6),
    ("Medellín — Manrique",        6.2750, -75.5450, 0.6),
    ("Medellín — La América",      6.2530, -75.6050, 0.5),
    ("Medellín — San Javier",      6.2650, -75.6150, 0.7),
    ("Envigado",                   6.1710, -75.5890, 1.0),
    ("Itagüí",                     6.1845, -75.6060, 0.8),
    ("Sabaneta",                   6.1515, -75.6165, 0.6),
    ("Bello",                      6.3380, -75.5560, 1.2),
    ("Copacabana",                 6.3500, -75.5100, 0.8),
    ("La Estrella",                6.1580, -75.6350, 0.7),
    ("Caldas",                     6.0890, -75.6360, 0.6),
    ("Girardota",                  6.3790, -75.4540, 0.7),
    ("Barbosa",                    6.4380, -75.3310, 0.6),
]

# ── Operators & Paramedics ───────────────────────────────────────────────────

OPERATOR_NAMES = [
    "Juan Martínez", "María López", "Carlos Restrepo", "Ana Gómez",
    "Pedro Salazar", "Luisa Fernández", "Andrés Muñoz", "Camila Ríos",
    "Diego Herrera", "Valentina Ospina",
]

PARAMEDIC_NAMES = [
    "Dr. Santiago Vélez", "Dra. Paula Arango", "Dr. Felipe Castaño",
    "Dra. Mariana Duque", "Dr. Alejandro Mesa", "Dra. Laura Montoya",
    "Dr. Sebastián Ruiz", "Dra. Daniela Zapata", "Dr. Mateo Giraldo",
    "Dra. Isabella Cano", "Dr. Tomás Henao", "Dra. Sofía Echeverri",
]

HOSPITALS = [
    "Hospital Pablo Tobón Uribe",
    "Clínica Las Américas",
    "Hospital General de Medellín",
    "Clínica El Rosario (Sede El Tesoro)",
    "Hospital San Vicente Fundación",
    "Clínica Medellín",
    "Clínica CES",
    "Hospital Marco Fidel Suárez (Bello)",
    "Hospital Manuel Uribe Ángel (Envigado)",
    "Clínica SOMA",
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def _jitter(center: float, radius_km: float) -> float:
    """Add random offset in degrees (~111 km per degree at equator)."""
    return center + random.gauss(0, radius_km / 111.0)


def _random_location() -> tuple[str, float, float]:
    spot = random.choice(LOCATIONS)
    name, lat, lng, radius = spot
    return name, round(_jitter(lat, radius), 6), round(_jitter(lng, radius), 6)


def _random_iso(base: datetime, offset_seconds: int) -> str:
    return (base + timedelta(seconds=offset_seconds)).isoformat() + "Z"


def _fmt_time(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds}s"
    m, s = divmod(seconds, 60)
    return f"{m}m {s:02d}s" if s else f"{m}m"


def _weighted_choice(options: list, weights: list):
    return random.choices(options, weights=weights, k=1)[0]


# ── Core generators ─────────────────────────────────────────────────────────

def generate_triage_assessment() -> dict | None:
    """Simulates the initial triage questions."""
    if random.random() < 0.05:          # 5 % have no triage info
        return None
    return {
        "bleeding":              random.random() < 0.30,
        "unconscious":           random.random() < 0.12,
        "difficulty_breathing":  random.random() < 0.20,
        "chest_pain":            random.random() < 0.15,
        "severe_pain":           random.random() < 0.35,
        "fracture_suspected":    random.random() < 0.18,
        "burn":                  random.random() < 0.08,
        "allergic_reaction":     random.random() < 0.06,
    }


def generate_emergency(idx: int, window_start: datetime, window_end: datetime) -> dict:
    """
    Produces one raw emergency document matching the backend API shape
    returned by GET /api/v1/historic/emergency.
    """
    loc_name, lat, lng = _random_location()
    status = _weighted_choice(STATUSES, STATUS_WEIGHTS)

    # Random timestamp inside the window, biased toward business hours
    hour_bias = random.choices(range(24), weights=[
        1,1,1,1,1,2,  3,5,7,8,8,7,  6,6,7,8,8,7,  5,4,3,2,1,1
    ], k=1)[0]
    day_offset = random.randint(0, (window_end - window_start).days)
    base = window_start.replace(hour=hour_bias, minute=random.randint(0, 59),
                                 second=random.randint(0, 59)) + timedelta(days=day_offset)
    if base > window_end:
        base = window_end - timedelta(minutes=random.randint(1, 120))

    # Build timeline with cumulative seconds
    cumulative = 0
    timeline: dict[str, str] = {}
    stage_seconds: dict[str, int] = {}

    canceled = status == "CANCELED"

    # Timeline must stop at the stage that matches finalStatus.
    # CLOSED → full pipeline.  ON_SITE → stops at ON_SITE.  etc.
    STATUS_TO_MAX_STAGE = {
        "CLOSED":      len(TIMELINE_STAGES) - 1,   # all stages
        "ON_SITE":     TIMELINE_STAGES.index("ON_SITE"),
        "IN_TRANSFER": TIMELINE_STAGES.index("IN_TRANSFER"),
        "CANCELED":    random.randint(1, 4),        # cancel early
    }
    max_stage_idx = STATUS_TO_MAX_STAGE.get(status, len(TIMELINE_STAGES) - 1)

    for i, stage in enumerate(TIMELINE_STAGES):
        if i > max_stage_idx:
            break
        if stage == "RECEIVED":
            gap = 0
        elif stage == "TRIAGED":
            gap = random.randint(30, 180)       # 30s – 3min
        elif stage == "PENDING_ASSIGNMENT":
            gap = random.randint(10, 60)
        elif stage == "ASSIGNED":
            gap = random.randint(20, 120)
        elif stage == "EN_ROUTE":
            gap = random.randint(5, 30)
        elif stage == "ON_SITE":
            gap = random.randint(180, 900)      # 3 – 15 min travel
        elif stage == "IN_TRANSFER":
            gap = random.randint(120, 600)      # scene time
        elif stage == "AT_HOSPITAL":
            gap = random.randint(300, 1200)     # transfer
        else:  # CLOSED
            gap = random.randint(60, 300)

        cumulative += gap
        timeline[stage] = _random_iso(base, cumulative)
        stage_seconds[stage] = gap

    operator = random.choice(OPERATOR_NAMES)
    paramedic = random.choice(PARAMEDIC_NAMES)
    accepting = random.choice([p for p in PARAMEDIC_NAMES if p != paramedic]) if random.random() < 0.85 else paramedic

    reached_assigned = "ASSIGNED" in timeline
    reached_transfer = "IN_TRANSFER" in timeline

    triage_variant = _weighted_choice(TRIAGE_VARIANTS, TRIAGE_WEIGHTS)

    doc = {
        "_id": f"EM-{idx:04d}",
        "id": f"EM-{idx:04d}",
        "filingNumber": 100_000 + idx,
        "triage": generate_triage_assessment(),
        "finalStatus": status,
        "assignedTo": {"name": paramedic} if reached_assigned else None,
        "transferedTo": {"name": accepting} if status == "CLOSED" else None,
        "timeline": timeline,
        # ── Extra fields useful for the frontend transforms ──
        "_meta": {
            "location": loc_name,
            "lat": lat,
            "lng": lng,
            "operator": operator,
            "triageVariant": triage_variant,
            "deliveryVariant": _weighted_choice(DELIVERY_VARIANTS, DELIVERY_WEIGHTS) if status == "CLOSED" else "cancelled" if canceled else "onsite",
            "hospital": random.choice(HOSPITALS) if status == "CLOSED" else None,
            "stageSeconds": stage_seconds,
            "totalSeconds": cumulative,
        }
    }
    return doc


# ── Aggregate builders (match frontend shapes) ──────────────────────────────

def build_analytics(emergencies: list[dict], window_start: datetime, window_end: datetime) -> dict:
    """
    Transforms the raw emergency list into the AnalyticsData shape
    consumed by useAnalytics on the frontend.
    """
    n = len(emergencies)

    # ── KPIs ──
    avg_triage = sum(e["_meta"]["stageSeconds"].get("TRIAGED", 0) for e in emergencies) / max(n, 1)
    avg_assign = sum(e["_meta"]["stageSeconds"].get("ASSIGNED", 0) for e in emergencies) / max(n, 1)
    avg_arrival = sum(e["_meta"]["stageSeconds"].get("ON_SITE", 0) for e in emergencies) / max(n, 1)
    avg_total  = sum(e["_meta"]["totalSeconds"] for e in emergencies) / max(n, 1)

    kpis = [
        {"label": "Tiempo triaje",      "value": _fmt_time(int(avg_triage)),
         "avg": _fmt_time(int(avg_triage * 1.05)), "delta": random.randint(-8, 2),
         "icon": "triage",  "color": "#EF4444"},
        {"label": "Tiempo asignación",  "value": _fmt_time(int(avg_assign)),
         "avg": _fmt_time(int(avg_assign * 1.03)), "delta": random.randint(-6, 4),
         "icon": "assign",  "color": "#F59E0B"},
        {"label": "Tiempo llegada",     "value": _fmt_time(int(avg_arrival)),
         "avg": _fmt_time(int(avg_arrival * 1.07)), "delta": random.randint(-10, 3),
         "icon": "arrival", "color": "#3B82F6"},
        {"label": "Tiempo total",       "value": _fmt_time(int(avg_total)),
         "avg": _fmt_time(int(avg_total * 1.04)),  "delta": random.randint(-5, 5),
         "icon": "total",   "color": "#8B5CF6"},
    ]

    # ── Pipeline ──
    stage_labels = [
        ("Recibida",          "RECEIVED",           "#6366F1"),
        ("Triaje",            "TRIAGED",             "#EF4444"),
        ("Pend. asignación",  "PENDING_ASSIGNMENT",  "#F59E0B"),
        ("Asignada",          "ASSIGNED",            "#10B981"),
        ("En camino",         "EN_ROUTE",            "#3B82F6"),
        ("En sitio",          "ON_SITE",             "#8B5CF6"),
        ("Traslado",          "IN_TRANSFER",         "#EC4899"),
        ("En hospital",       "AT_HOSPITAL",         "#14B8A6"),
    ]
    pipeline = []
    for label, key, color in stage_labels:
        avg_s = sum(e["_meta"]["stageSeconds"].get(key, 0) for e in emergencies) / max(n, 1)
        pipeline.append({"stage": label, "time": _fmt_time(int(avg_s)), "color": color})

    # ── Trends ──
    hourly = [0] * 24
    daily  = [0] * 7
    monthly = [0] * 12
    for e in emergencies:
        ts = e["timeline"].get("RECEIVED")
        if ts:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            hourly[dt.hour] += 1
            daily[dt.weekday()] += 1
            monthly[dt.month - 1] += 1

    kpi_monthly = {
        "triaje":     [random.randint(50, 120) for _ in range(12)],
        "asignacion": [random.randint(40, 100) for _ in range(12)],
        "llegada":    [random.randint(200, 600) for _ in range(12)],
        "total":      [random.randint(600, 1800) for _ in range(12)],
    }

    trends = {"hourly": hourly, "daily": daily, "monthly": monthly, "kpis": kpi_monthly}

    # ── Operators ──
    op_map: dict[str, list] = {}
    for e in emergencies:
        op = e["_meta"]["operator"]
        op_map.setdefault(op, []).append(e["_meta"]["totalSeconds"])
    operators = [
        {
            "name": name,
            "attended": len(times),
            "avgTime": _fmt_time(int(sum(times) / len(times))),
            "active": random.random() < 0.8,
        }
        for name, times in op_map.items()
    ]

    # ── Comparative (current vs previous period) ──
    half = n // 2
    current_count = half + random.randint(-10, 10)
    prev_count = n - current_count
    delta_pct = round((current_count - prev_count) / max(prev_count, 1) * 100)
    comparative = [
        {"label": "Total emergencias", "current": str(current_count), "prev": str(prev_count),
         "delta": f"{delta_pct:+d}%", "positive": delta_pct < 0},
        {"label": "Tiempo promedio",
         "current": _fmt_time(int(avg_total)), "prev": _fmt_time(int(avg_total * 1.08)),
         "delta": f"-{random.randint(3,12)}%", "positive": True},
        {"label": "Canceladas",
         "current": str(sum(1 for e in emergencies[:current_count] if e["finalStatus"] == "CANCELED")),
         "prev": str(sum(1 for e in emergencies[current_count:] if e["finalStatus"] == "CANCELED")),
         "delta": f"{random.randint(-15, 15):+d}%", "positive": random.choice([True, False])},
    ]

    # ── Heatmap ──
    heatmap = [
        [e["_meta"]["lat"], e["_meta"]["lng"],
         round(random.uniform(0.2, 1.0), 2)]
        for e in emergencies
    ]

    return {
        "emergencyCount": n,
        "kpis": kpis,
        "pipeline": pipeline,
        "trends": trends,
        "operators": operators,
        "comparative": comparative,
        "heatmapPoints": heatmap,
    }


def build_history(emergencies: list[dict]) -> list[dict]:
    """Builds the HistoryRow[] shape for the HistoryTable."""
    rows = []
    for e in emergencies:
        meta = e["_meta"]
        rows.append({
            "id": e["id"],
            "date": datetime.fromisoformat(
                e["timeline"]["RECEIVED"].replace("Z", "+00:00")
            ).strftime("%d/%m %H:%M"),
            "operator": meta["operator"],
            "opTriage": {"label": meta["triageVariant"].capitalize(), "variant": meta["triageVariant"]},
            "assigned": (e.get("assignedTo") or {}).get("name", "—"),
            "accepted": (e.get("transferedTo") or {}).get("name", "—"),
            "tArrival": _fmt_time(meta["stageSeconds"].get("ON_SITE", 0)),
            "siteTriage": {"label": meta["triageVariant"].capitalize(), "variant": meta["triageVariant"]},
            "hospital": meta["hospital"] or "—",
            "tHospital": _fmt_time(meta["stageSeconds"].get("AT_HOSPITAL", 0)),
            "delivery": {"label": meta["deliveryVariant"].capitalize(), "variant": meta["deliveryVariant"]},
            "tTotal": _fmt_time(meta["totalSeconds"]),
        })
    return rows


def build_statistics(emergencies: list[dict], window_start: datetime, window_end: datetime) -> dict:
    """
    Builds the backend GET /api/v1/historic/statistics response shape.
    """
    n = len(emergencies)
    avg_total = sum(e["_meta"]["totalSeconds"] for e in emergencies) / max(n, 1)

    avg_timeline: dict[str, float] = {}
    for stage in TIMELINE_STAGES:
        vals = [e["_meta"]["stageSeconds"].get(stage, 0) for e in emergencies]
        avg_timeline[stage] = round(sum(vals) / max(n, 1), 1)

    hour_hist: dict[str, int] = {}
    for e in emergencies:
        ts = e["timeline"].get("RECEIVED")
        if ts:
            h = str(datetime.fromisoformat(ts.replace("Z", "+00:00")).hour)
            hour_hist[h] = hour_hist.get(h, 0) + 1

    return {
        "since": window_start.isoformat() + "Z",
        "to": window_end.isoformat() + "Z",
        "emergencyCount": n,
        "averageTotalTime": round(avg_total, 1),
        "averageTimeline": avg_timeline,
        "hourHistogram": hour_hist,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed fake emergency data")
    parser.add_argument("--count", type=int, default=300, help="Number of emergencies to generate")
    parser.add_argument("--days", type=int, default=90, help="Time window in days (backwards from today)")
    parser.add_argument("--json-only", action="store_true", help="Export JSON files, skip MongoDB")
    parser.add_argument("--mongo-uri", type=str, default="mongodb://localhost:27017")
    parser.add_argument("--db", type=str, default="emergencies")
    parser.add_argument("--out-dir", type=str, default=".", help="Output directory for JSON files")
    args = parser.parse_args()

    random.seed(42)  # reproducible
    window_end = datetime.utcnow()
    window_start = window_end - timedelta(days=args.days)

    print(f"Generating {args.count} emergencies over {args.days} days …")
    emergencies = [generate_emergency(i + 1, window_start, window_end) for i in range(args.count)]

    # Sort by RECEIVED timestamp
    emergencies.sort(key=lambda e: e["timeline"].get("RECEIVED", ""))

    # Build aggregate shapes
    analytics = build_analytics(emergencies, window_start, window_end)
    history   = build_history(emergencies)
    stats     = build_statistics(emergencies, window_start, window_end)

    # Strip _meta before exporting raw emergencies (it's internal)
    raw_emergencies = [{k: v for k, v in e.items() if k != "_meta"} for e in emergencies]

    # ── Export JSON ──
    out = args.out_dir
    files = {
        f"{out}/emergencies_raw.json":   raw_emergencies,
        f"{out}/analytics_data.json":    analytics,
        f"{out}/history_rows.json":      history,
        f"{out}/statistics.json":        stats,
    }
    for path, data in files.items():
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ {path}  ({len(json.dumps(data)) / 1024:.0f} KB)")

    # ── MongoDB insert ──
    if not args.json_only:
        try:
            from pymongo import MongoClient
            client = MongoClient(args.mongo_uri)
            db = client[args.db]

            db.emergencies.drop()
            db.emergencies.insert_many(raw_emergencies)
            print(f"  ✓ Inserted {len(raw_emergencies)} docs → {args.db}.emergencies")

            db.analytics.drop()
            db.analytics.insert_one(analytics)
            print(f"  ✓ Inserted analytics → {args.db}.analytics")

            db.statistics.drop()
            db.statistics.insert_one(stats)
            print(f"  ✓ Inserted statistics → {args.db}.statistics")

            client.close()
        except Exception as exc:
            print(f"  ✗ MongoDB error: {exc}")
            print("    JSON files were still exported. Use --json-only to skip DB.")
    else:
        print("\n  --json-only mode: skipping MongoDB insert.")

    print("\nDone ✓")


if __name__ == "__main__":
    main()
