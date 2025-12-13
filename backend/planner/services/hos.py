from dataclasses import dataclass
from datetime import datetime, timedelta
import math

QUARTER = timedelta(minutes=15)

def round_up_15(mins: float) -> int:
    return int(math.ceil(mins / 15) * 15)

@dataclass
class Event:
    start: datetime
    end: datetime
    status: str         # OFF_DUTY | SLEEPER | DRIVING | ON_DUTY
    remark: str
    miles: float = 0.0

def add_event(events, start, minutes, status, remark, miles=0.0):
    minutes = round_up_15(minutes)
    end = start + timedelta(minutes=minutes)
    events.append(Event(start, end, status, remark, miles))
    return end

def plan_hos_timeline(
    start_time: datetime,
    distance_miles: float,
    avg_speed_mph: float,
    cycle_used_hours: float,
    pickup_label: str,
    dropoff_label: str
):
    """
    Practical MVP scheduler (rule-based, 15-min increments):
    - Property-carrying, 70h/8d cycle
    - 11h driving in 14h window
    - 30-min break after 8h driving
    - Fuel every 1000 miles, 1h ON_DUTY
    - Pickup/Dropoff 1h ON_DUTY each
    - No adverse conditions
    """
    warnings = []
    events = []
    t = start_time

    # 70h/8d cycle check
    cycle_remaining = 70.0 - cycle_used_hours
    if cycle_remaining <= 0:
        t = add_event(events, t, 34*60, "OFF_DUTY", "34-hour reset (cycle exceeded) - Home/Terminal")
        cycle_remaining = 70.0

    # Pickup
    t = add_event(events, t, 60, "ON_DUTY", f"Pickup / loading - {pickup_label}")
    cycle_remaining -= 1.0

    miles_left = distance_miles
    driving_since_break = 0.0  # hours
    driving_in_window = 0.0    # hours
    window_start = start_time  # begins when work begins
    next_fuel_at = 1000.0

    while miles_left > 0.01:
        # If approaching cycle limit, take 34h reset
        if cycle_remaining < 1.0:
            t = add_event(events, t, 34*60, "OFF_DUTY", "34-hour reset (cycle) - Safe parking")
            cycle_remaining = 70.0
            window_start = t
            driving_in_window = 0.0
            driving_since_break = 0.0
            continue

        # 14-hour window or 11-hour driving reached => 10h rest
        if (t - window_start) >= timedelta(hours=14) or driving_in_window >= 11.0:
            t = add_event(events, t, 10*60, "SLEEPER", "10-hour rest (HOS reset) - Safe parking")
            window_start = t
            driving_in_window = 0.0
            driving_since_break = 0.0
            continue

        # 30-min break after 8h driving
        if driving_since_break >= 8.0:
            t = add_event(events, t, 30, "OFF_DUTY", "30-min break - Rest area")
            driving_since_break = 0.0
            continue

        # Fuel stop once each 1000 miles driven
        driven_total = distance_miles - miles_left
        if driven_total >= next_fuel_at and miles_left > 0.01:
            t = add_event(events, t, 60, "ON_DUTY", "Refueling - Fuel station")
            cycle_remaining -= 1.0
            next_fuel_at += 1000.0
            continue

        remaining_drive_hours = min(
            11.0 - driving_in_window,
            14.0 - (t - window_start).total_seconds()/3600.0
        )
        remaining_before_break = 8.0 - driving_since_break
        max_chunk_hours = max(0.0, min(remaining_drive_hours, remaining_before_break))

        if max_chunk_hours <= 0.0:
            t = add_event(events, t, 10*60, "SLEEPER", "10-hour rest (no driving time left) - Safe parking")
            window_start = t
            driving_in_window = 0.0
            driving_since_break = 0.0
            continue

        chunk_miles = min(miles_left, max_chunk_hours * avg_speed_mph)
        chunk_hours = chunk_miles / avg_speed_mph

        t = add_event(events, t, chunk_hours*60, "DRIVING", "Driving - per route", miles=chunk_miles)

        miles_left -= chunk_miles
        driving_in_window += chunk_hours
        driving_since_break += chunk_hours
        cycle_remaining -= chunk_hours

    # Dropoff
    t = add_event(events, t, 60, "ON_DUTY", f"Dropoff / unloading - {dropoff_label}")
    cycle_remaining -= 1.0

    return events, warnings
