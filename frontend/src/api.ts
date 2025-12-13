export type LatLng = { lat: number; lng: number };

export type PlanTripRequest = {
  current: LatLng;
  pickup: LatLng;
  dropoff: LatLng;
  cycle_used_hours: number;
  start_time_local: string; // ISO
  pickup_label?: string;
  dropoff_label?: string;
  avg_speed_mph?: number;
};

export type ELDStatus = "OFF_DUTY" | "SLEEPER" | "DRIVING" | "ON_DUTY";

export type ELDLogEvent = {
  start: string;
  end: string;
  status: ELDStatus;
  remark: string;
  miles?: number;
};

export type DailyLog = {
  date: string;
  total_miles: number;
  events: ELDLogEvent[];
};

export type PlanTripResponse = {
  route: {
    distance_miles: number;
    duration_hours: number;
    geojson_leg1: any;
    geojson_leg2: any;
  };
  daily_logs: DailyLog[];
  warnings: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";

export async function planTrip(payload: PlanTripRequest): Promise<PlanTripResponse> {
  const res = await fetch(`${API_BASE}/plan-trip/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
