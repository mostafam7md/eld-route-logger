import React, { useEffect, useRef } from "react";
import type { ELDLogEvent } from "../api";

const BG_SRC = "/blank-paper-log.png";

// Must match your paper image dimensions
const CANVAS_W = 513;
const CANVAS_H = 518;

// Tune these once by eyeballing in browser (these are close)
const GRID = { x: 85, y: 190, w: 355, h: 120 };

// Row index from top to bottom in the grid
const ROW_Y = {
  OFF_DUTY: 0,
  SLEEPER: 1,
  DRIVING: 2,
  ON_DUTY: 3,
} as const;

function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function yForStatus(status: ELDLogEvent["status"]) {
  const row = ROW_Y[status];
  return GRID.y + row * (GRID.h / 4) + (GRID.h / 8);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function ELDCanvas({
  date,
  totalMiles,
  events,
}: {
  date: string;
  totalMiles: number;
  events: ELDLogEvent[];
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const bg = new Image();
    bg.src = BG_SRC;

    bg.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      // Write date + total miles (fine-tune positions later)
      ctx.fillStyle = "black";
      ctx.font = "12px Arial";
      ctx.fillText(date, 155, 40);
      ctx.fillText(String(totalMiles), 92, 86);

      if (!events.length) return;

      // Sort events by time
      const sorted = [...events].sort(
        (a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start)
      );

      const pxPerMin = GRID.w / (24 * 60);

      const xForMin = (m: number) => GRID.x + m * pxPerMin;

      // Build “step” points:
      // Start at first event start on its status row
      // For each event:
      //   - horizontal to event end at same row
      //   - if next event exists and status differs:
      //         vertical at same x to next row
      //
      // Also drop red dots at each corner.
      type Pt = { x: number; y: number; dot?: boolean };
      const pts: Pt[] = [];

      const first = sorted[0];
      const startMin = clamp(hhmmToMinutes(first.start), 0, 1440);
      pts.push({ x: xForMin(startMin), y: yForStatus(first.status), dot: true });

      for (let i = 0; i < sorted.length; i++) {
        const ev = sorted[i];
        const a = clamp(hhmmToMinutes(ev.start), 0, 1440);
        const b = clamp(hhmmToMinutes(ev.end), 0, 1440);

        // Ensure we’re at event start (in case of gaps/rounding)
        const curRowY = yForStatus(ev.status);
        const curX = xForMin(a);
        const last = pts[pts.length - 1];
        if (Math.abs(last.x - curX) > 0.5 || Math.abs(last.y - curRowY) > 0.5) {
          // move (gap) with step: vertical then horizontal (or just jump)
          pts.push({ x: curX, y: last.y, dot: true });
          pts.push({ x: curX, y: curRowY, dot: true });
        }

        // Horizontal segment to event end
        const endX = xForMin(b);
        pts.push({ x: endX, y: curRowY, dot: true });

        // Transition to next event status at same timestamp (vertical line)
        const next = sorted[i + 1];
        if (next) {
          const nextY = yForStatus(next.status);
          if (Math.abs(nextY - curRowY) > 0.5) {
            pts.push({ x: endX, y: nextY, dot: true });
          }
        }
      }

      // Draw polyline (black thick)
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Red dots
      ctx.fillStyle = "red";
      for (const p of pts) {
        if (!p.dot) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // OPTIONAL: simple remark “leader lines” down into remarks area
      // (You can remove this block if you only want text.)
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;

      const remarksTopY = 310; // where leader lines start going down
      const remarksTextX = 60;
      let ry = 360;

      ctx.fillStyle = "black";
      ctx.font = "10px Arial";

      // choose a few key events for callouts
      const callouts = sorted.slice(0, 6);

      for (const ev of callouts) {
        const x = xForMin(hhmmToMinutes(ev.start));
        const y = yForStatus(ev.status);

        // leader line: from point down
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, remarksTopY);
        ctx.stroke();

        // label
        ctx.fillText(`${ev.remark}`, remarksTextX, ry);
        ry += 14;
      }
    };
  }, [date, totalMiles, events]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-3">
      <canvas ref={ref} className="w-full h-auto rounded-xl border" />
    </div>
  );
}
