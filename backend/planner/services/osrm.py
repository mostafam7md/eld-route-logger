import requests

OSRM = "https://router.project-osrm.org"

def get_route(a, b):
    # a, b are dicts: {lat,lng}
    url = f"{OSRM}/route/v1/driving/{a['lng']},{a['lat']};{b['lng']},{b['lat']}"
    params = {"overview": "full", "geometries": "geojson"}
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    route = data["routes"][0]
    meters = route["distance"]
    seconds = route["duration"]
    return {
        "distance_miles": meters / 1609.344,
        "duration_hours": seconds / 3600,
        "geojson": route["geometry"],
    }
