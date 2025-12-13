import React, { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { PlanTripResponse } from "../api";

export default function RouteMap({ data }: { data: PlanTripResponse | null }) {
  const center = useMemo(() => {
    // fallback center
    return [37.0902, -95.7129] as [number, number];
  }, []);

  const leg1 = data?.route?.geojson_leg1;
  const leg2 = data?.route?.geojson_leg2;

  return (
    <div className="map-wrap rounded-2xl overflow-hidden border">
      <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {leg1 ? <GeoJSON data={leg1 as any} /> : null}
        {leg2 ? <GeoJSON data={leg2 as any} /> : null}
      </MapContainer>
    </div>
  );
}
