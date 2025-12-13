from rest_framework.decorators import api_view
from rest_framework.response import Response
from dateutil import parser

from .services.osrm import get_route
from .services.hos import plan_hos_timeline
from .utils.daily_split import split_events_by_day

@api_view(["POST"])
def plan_trip(request):
    body = request.data

    start_time = parser.isoparse(body["start_time_local"])

    # route legs: current->pickup, pickup->dropoff
    r1 = get_route(body["current"], body["pickup"])
    r2 = get_route(body["pickup"], body["dropoff"])

    total_miles = r1["distance_miles"] + r2["distance_miles"]

    # Average speed assumption (editable)
    avg_speed = float(body.get("avg_speed_mph", 62.0))

    events, warnings = plan_hos_timeline(
        start_time=start_time,
        distance_miles=total_miles,
        avg_speed_mph=avg_speed,
        cycle_used_hours=float(body["cycle_used_hours"]),
        pickup_label=body.get("pickup_label", "Pickup"),
        dropoff_label=body.get("dropoff_label", "Dropoff"),
    )

    days = split_events_by_day(events)

    daily_logs = []
    for date_str, evs in sorted(days.items()):
        total_miles_day = sum(x.get("miles", 0) for x in evs)
        daily_logs.append({
            "date": date_str,
            "total_miles": round(total_miles_day, 1),
            "events": evs
        })

    return Response({
        "route": {
            "distance_miles": round(total_miles, 1),
            "duration_hours": round((total_miles / avg_speed), 2),
            "geojson_leg1": r1["geojson"],
            "geojson_leg2": r2["geojson"],
        },
        "daily_logs": daily_logs,
        "warnings": warnings
    })
