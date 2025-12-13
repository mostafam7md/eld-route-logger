import React, { useMemo, useRef, useState } from "react";
import type { DailyLog } from "../api";
import ELDCanvas from "./ELDCanvas";
import jsPDF from "jspdf";

export default function LogCarousel({ logs }: { logs: DailyLog[] }) {
  const [idx, setIdx] = useState(0);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const cur = logs[idx];

  const canPrev = idx > 0;
  const canNext = idx < logs.length - 1;

  const exportPDF = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    // Fit image nicely on page
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = canvas.width;
    const imgH = canvas.height;
    const scale = Math.min((pageW - 40) / imgW, (pageH - 80) / imgH);

    const w = imgW * scale;
    const h = imgH * scale;

    pdf.setFontSize(12);
    pdf.text(`Driver's Daily Log - ${cur?.date ?? ""}`, 20, 30);
    pdf.addImage(imgData, "PNG", 20, 50, w, h);
    pdf.save(`ELD_${cur?.date ?? "log"}.pdf`);
  };

  if (!logs.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-slate-500">
        Plan a trip to generate daily log sheets.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-600">
          Day <span className="font-semibold text-slate-900">{idx + 1}</span> / {logs.length}
          <span className="ml-2 text-xs text-slate-500">({cur.date})</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            disabled={!canPrev}
            className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() => setIdx((v) => Math.min(logs.length - 1, v + 1))}
            disabled={!canNext}
            className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
          <button
            onClick={exportPDF}
            className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-800"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div ref={canvasRef}>
        <ELDCanvas date={cur.date} totalMiles={cur.total_miles} events={cur.events} />
      </div>
    </div>
  );
}
