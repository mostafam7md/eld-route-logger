import React, { useMemo, useState } from "react";

export type LatLng = { lat: number; lng: number };

export type TripFormValues = {
  current: LatLng;
  pickup: LatLng;
  dropoff: LatLng;
  cycleUsed: number;
  startTimeISO: string;
  pickupLabel: string;
  dropoffLabel: string;
  avgSpeed: number;
};

const defaultNowISO = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16); // for datetime-local input
};

export default function TripForm({
  onSubmit,
  loading,
}: {
  onSubmit: (vals: TripFormValues) => void;
  loading: boolean;
}) {
  // Defaults: sample coordinates (Los Angeles -> Amarillo -> Denver-ish)
  const [currentLat, setCurrentLat] = useState(34.0522);
  const [currentLng, setCurrentLng] = useState(-118.2437);
  const [pickupLat, setPickupLat] = useState(35.221997);
  const [pickupLng, setPickupLng] = useState(-101.831297);
  const [dropLat, setDropLat] = useState(39.7392);
  const [dropLng, setDropLng] = useState(-104.9903);

  const [cycleUsed, setCycleUsed] = useState(42.5);
  const [startLocal, setStartLocal] = useState(defaultNowISO());
  const [pickupLabel, setPickupLabel] = useState("Pickup City, ST");
  const [dropoffLabel, setDropoffLabel] = useState("Dropoff City, ST");
  const [avgSpeed, setAvgSpeed] = useState(62);

  const startTimeISO = useMemo(() => {
    // Convert datetime-local (no timezone) to ISO by treating it as local time
    // For MVP: create Date from input and use toISOString()
    const d = new Date(startLocal);
    return d.toISOString();
  }, [startLocal]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      current: { lat: currentLat, lng: currentLng },
      pickup: { lat: pickupLat, lng: pickupLng },
      dropoff: { lat: dropLat, lng: dropLng },
      cycleUsed,
      startTimeISO,
      pickupLabel,
      dropoffLabel,
      avgSpeed,
    });
  };

  const Field = ({ label, children }: any) => (
    <label className="block">
      <div className="text-xs font-medium text-slate-600 mb-1">{label}</div>
      {children}
    </label>
  );

  const Num = (props: any) => (
    <input
      {...props}
      type="number"
      step="any"
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
    />
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Trip Inputs</div>
        <div className="text-xs text-slate-500">Enter coordinates (lat/lng) and cycle hours.</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Current Lat"><Num value={currentLat} onChange={(e:any)=>setCurrentLat(+e.target.value)} /></Field>
        <Field label="Current Lng"><Num value={currentLng} onChange={(e:any)=>setCurrentLng(+e.target.value)} /></Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pickup Lat"><Num value={pickupLat} onChange={(e:any)=>setPickupLat(+e.target.value)} /></Field>
        <Field label="Pickup Lng"><Num value={pickupLng} onChange={(e:any)=>setPickupLng(+e.target.value)} /></Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dropoff Lat"><Num value={dropLat} onChange={(e:any)=>setDropLat(+e.target.value)} /></Field>
        <Field label="Dropoff Lng"><Num value={dropLng} onChange={(e:any)=>setDropLng(+e.target.value)} /></Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Current Cycle Used (hrs)">
          <Num value={cycleUsed} onChange={(e:any)=>setCycleUsed(+e.target.value)} />
        </Field>
        <Field label="Avg Speed (mph)">
          <Num value={avgSpeed} onChange={(e:any)=>setAvgSpeed(+e.target.value)} />
        </Field>
      </div>

      <Field label="Start Time (local)">
        <input
          type="datetime-local"
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </Field>

      <Field label="Pickup Label (for remarks)">
        <input
          value={pickupLabel}
          onChange={(e)=>setPickupLabel(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="City, ST"
        />
      </Field>

      <Field label="Dropoff Label (for remarks)">
        <input
          value={dropoffLabel}
          onChange={(e)=>setDropoffLabel(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="City, ST"
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Planning..." : "Plan Trip"}
      </button>

      <div className="text-[11px] text-slate-500 leading-relaxed">
        This MVP uses OSRM (free routing) and a rule-based HOS scheduler:
        11h driving / 14h window, 30-min break after 8h driving, fuel every 1000 miles (1h on duty),
        pickup + dropoff 1h on duty each, 70h/8d cycle with 34h reset.
      </div>
    </form>
  );
}
