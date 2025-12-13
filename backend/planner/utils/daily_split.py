from datetime import datetime, timedelta

def split_events_by_day(events, home_tz_start_hour=0):
    """Split events into daily logs by midnight boundary (local time assumed)."""
    days = {}
    for ev in events:
        cur = ev.start
        while cur < ev.end:
            # Create day boundary at midnight in the same timezone as the event
            day_start = datetime(cur.year, cur.month, cur.day, home_tz_start_hour, 0, 0, tzinfo=cur.tzinfo)
            day_end = day_start + timedelta(days=1)
            seg_end = min(ev.end, day_end)
            # Use the date from the timezone-aware datetime for the key
            key = cur.date().isoformat()

            if key not in days:
                days[key] = []

            ratio = (seg_end-cur).total_seconds() / (ev.end-ev.start).total_seconds()
            miles = (ev.miles * ratio) if ev.miles else 0

            days[key].append({
                "start": cur.strftime("%H:%M"),
                "end": seg_end.strftime("%H:%M"),
                "status": ev.status,
                "remark": ev.remark,
                "miles": miles,
            })
            cur = seg_end
    return days
