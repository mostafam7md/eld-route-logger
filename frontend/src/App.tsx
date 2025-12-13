import React, { useMemo, useState } from "react";
import { planTrip, type DailyLog, type PlanTripResponse } from "./api";
import TripForm, { type TripFormValues } from "./components/TripForm";
import RouteMap from "./components/RouteMap";
import LogCarousel from "./components/LogCarousel";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlanTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (vals: TripFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await planTrip({
        current: vals.current,
        pickup: vals.pickup,
        dropoff: vals.dropoff,
        cycle_used_hours: vals.cycleUsed,
        start_time_local: vals.startTimeISO,
        pickup_label: vals.pickupLabel,
        dropoff_label: vals.dropoffLabel,
        avg_speed_mph: vals.avgSpeed,
      });
      setData(res);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const logs: DailyLog[] = useMemo(() => data?.daily_logs ?? [], [data]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">ELD Route & Driver’s Daily Log</h1>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <TripForm onSubmit={onSubmit} loading={loading} />
            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {data?.warnings?.length ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="font-medium mb-1">Warnings</div>
                <ul className="list-disc ml-5">
                  {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            ) : null}
          </div>

          {data && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border p-4">
              <div className="text-sm text-slate-600">Route Summary</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {data.route.distance_miles} mi
              </div>
              <div className="text-sm text-slate-500">
                Estimated drive time: {data.route.duration_hours} hrs (speed assumption)
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Route Map</h2>
              <span className="text-xs text-slate-500">OpenStreetMap + OSRM</span>
            </div>
            <RouteMap data={data} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Daily ELD Logs</h2>
              <span className="text-xs text-slate-500">Drawn onto the provided paper log</span>
            </div>
            <LogCarousel logs={logs} />
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-slate-500">
          Spotter-AI
      </footer>
    </div>
  );
}
