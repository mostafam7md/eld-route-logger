
## Repo Structure
- `backend/` Django + DRF API
- `frontend/` React (Vite) + Tailwind + Leaflet map + Canvas ELD renderer

## Run Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

Backend will run at: `http://127.0.0.1:8000`

## Run Frontend
```bash
cd frontend
npm install
cp .env.example .env  # optional, defaults to http://127.0.0.1:8000/api
npm run dev
```

Frontend will run at: `http://127.0.0.1:5173`

## API
POST `http://127.0.0.1:8000/api/plan-trip/`

Body example:
```json
{
  "current": {"lat": 34.0522, "lng": -118.2437},
  "pickup": {"lat": 35.221997, "lng": -101.831297},
  "dropoff": {"lat": 39.7392, "lng": -104.9903},
  "cycle_used_hours": 42.5,
  "start_time_local": "2025-12-13T08:00:00Z",
  "pickup_label": "Los Angeles, CA",
  "dropoff_label": "Denver, CO",
  "avg_speed_mph": 62
}
```

## Notes / Improvements
- The paper log field coordinates are *approximate* and can be fine-tuned in `frontend/src/components/ELDCanvas.tsx`
- For better stop city/state labels, you can add reverse geocoding (Nominatim) or use a paid geocoder.
- You can merge the two route legs into a single polyline and add markers for stops.
