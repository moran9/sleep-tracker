import { useEffect, useRef, useState } from 'react';
import { toMin, dur, inPeriod } from '../utils';

const SLOTS = 1440;
const ROW = 24, LW = 44, HDR = 50, TW = 190;
function slotMin(s) { return (19 * 60 + s) % 1440; }

// 4 states
const C_NIGHT_SLEEP = '#5b8dd9'; // night asleep   — blue
const C_NIGHT_AWAKE = '#2e4a7a'; // night awake    — dark blue
const C_NAP_SLEEP   = '#e0a855'; // nap asleep     — amber
const C_NAP_AWAKE   = '#7a5828'; // nap awake      — dark amber

function getCellColor(day, slot) {
  const mid = slotMin(slot);
  for (const p of day.periods) {
    const en = p.enter ? toMin(p.enter) : null;
    const ex = p.exit  ? toMin(p.exit)  : null;
    const sl = p.sleep ? toMin(p.sleep) : en;
    const wk = p.wake  ? toMin(p.wake)  : ex;
    const periodStart = en ?? sl;
    const periodEnd   = ex ?? wk;
    if (!inPeriod(mid, periodStart, periodEnd)) continue;
    const asleep = inPeriod(mid, sl, wk);
    if (p.type === 'night')  return asleep ? C_NIGHT_SLEEP : C_NIGHT_AWAKE;
    if (p.type === 'siesta') return asleep ? C_NAP_SLEEP   : C_NAP_AWAKE;
  }
  return '#181b26';
}

function calcDayTotals(day) {
  let nightSleep = 0, siestaSleep = 0, tomas = 0;
  day.periods.forEach(p => {
    const s = dur(toMin(p.sleep), toMin(p.wake));
    if (p.type === 'night') { nightSleep += s; if (p.toma === 'S') tomas++; }
    else siestaSleep += s;
  });
  return { nightSleep, siestaSleep, total: nightSleep + siestaSleep, tomas };
}

function refColor(val, lo) {
  if (!val) return '#4a5270';
  const below = lo - val;
  if (below <= 0)  return '#6ecfa0';
  if (below < 60)  return '#e8d07a';
  if (below < 120) return '#e8a87c';
  return '#d97070';
}

function buildSvg(active, availW) {
  const barAvail = availW - LW - TW;
  const PX = barAvail / SLOTS;
  const BAR_W = LW + SLOTS * PX;
  const W = availW;
  const H = HDR + active.length * ROW;

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${W}" height="${H}" fill="#111318"/>`;

  active.forEach((_, di) => {
    if (di % 2 === 0) svg += `<rect x="0" y="${HDR + di * ROW}" width="${W}" height="${ROW}" fill="#141720"/>`;
  });

  svg += `<text x="${BAR_W + 6}"   y="${HDR - 26}" font-family="monospace" font-size="11" fill="#2e6a4a">≥10h</text>`;
  svg += `<text x="${BAR_W + 70}"  y="${HDR - 26}" font-family="monospace" font-size="11" fill="#2e6a4a">≥3h</text>`;
  svg += `<text x="${BAR_W + 130}" y="${HDR - 26}" font-family="monospace" font-size="11" fill="#2e6a4a">≥14h</text>`;
  svg += `<text x="${BAR_W + 6}"   y="${HDR - 10}" font-family="monospace" font-size="12" fill="#4a5270">noche</text>`;
  svg += `<text x="${BAR_W + 70}"  y="${HDR - 10}" font-family="monospace" font-size="12" fill="#4a5270">siesta</text>`;
  svg += `<text x="${BAR_W + 130}" y="${HDR - 10}" font-family="monospace" font-size="12" fill="#4a5270">total</text>`;
  svg += `<line x1="${BAR_W}" y1="0" x2="${BAR_W}" y2="${H}" stroke="#2a2f48" stroke-width="1"/>`;

  for (let s = 0; s < SLOTS; s += 60) {
    const min = slotMin(s), h = Math.floor(min / 60), x = LW + s * PX;
    const isM = h === 0;
    svg += `<line x1="${x}" y1="${HDR}" x2="${x}" y2="${H}" stroke="${isM ? '#3a1525' : '#1e2235'}" stroke-width="${isM ? 1.5 : 0.5}"/>`;
    svg += `<text x="${x + 2}" y="${HDR - 10}" font-family="monospace" font-size="12" fill="${isM ? '#e05c5c' : '#4a5270'}">${String(h).padStart(2, '0')}h</text>`;
  }
  svg += `<line x1="${LW}" y1="${HDR - 1}" x2="${BAR_W}" y2="${HDR - 1}" fill="none" stroke="#2a2f48" stroke-width="1"/>`;

  // dots are rendered as HTML overlays; just draw the SVG bars here
  active.forEach((day, di) => {
    const y = HDR + di * ROW;
    svg += `<text x="${LW - 3}" y="${y + ROW / 2 + 4}" font-family="monospace" font-size="12" fill="#6b7494" text-anchor="end">${day.date || `D${di + 1}`}</text>`;

    const runs = [];
    let rc = null, rs = 0;
    for (let s = 0; s <= SLOTS; s++) {
      const col = s < SLOTS ? getCellColor(day, s) : null;
      if (col !== rc) {
        if (rc !== null) runs.push({ col: rc, start: rs, end: s });
        rc = col; rs = s;
      }
    }
    runs.forEach(run => {
      const bg = run.col, isBg = (bg === '#111318' || bg === '#141720' || bg === '#181b26');
      if (isBg) return;
      const rx = LW + run.start * PX, rw = (run.end - run.start) * PX;
      const r = Math.min(4, ROW / 2 - 1);
      svg += `<rect x="${rx}" y="${y + 2}" width="${rw}" height="${ROW - 4}" rx="${r}" ry="${r}" fill="${bg}"/>`;
      const isSleep = (bg === C_NIGHT_SLEEP || bg === C_NAP_SLEEP);
      if (isSleep && rw > 24) {
        const durMin = run.end - run.start;
        const h = Math.floor(durMin / 60), m = durMin % 60;
        const lbl = h > 0 ? (m ? `${h}h${m}m` : `${h}h`) : `${m}m`;
        svg += `<text x="${rx + rw / 2}" y="${y + ROW / 2 + 4}" font-family="monospace" font-size="9" fill="rgba(0,0,0,0.55)" text-anchor="middle">${lbl}</text>`;
      }
    });

    const t = calcDayTotals(day);
    const fmtVal = m => m ? `${Math.floor(m / 60)}h${m % 60 ? Math.round(m % 60) + 'm' : ''}` : '-';
    const ty = y + ROW / 2 + 4;
    svg += `<text x="${BAR_W + 6}"   y="${ty}" font-family="monospace" font-size="12" fill="${refColor(t.nightSleep, 600)}">${fmtVal(t.nightSleep)}</text>`;
    svg += `<text x="${BAR_W + 70}"  y="${ty}" font-family="monospace" font-size="12" fill="${refColor(t.siestaSleep, 180)}">${fmtVal(t.siestaSleep)}</text>`;
    svg += `<text x="${BAR_W + 130}" y="${ty}" font-family="monospace" font-size="12" font-weight="bold" fill="${refColor(t.total, 840)}">${fmtVal(t.total)}</text>`;
  });

  svg += '</svg>';
  return svg;
}

// Returns one overlay rect per period that has a comment
function calcCommentOverlays(active, availW) {
  const PX = (availW - LW - TW) / SLOTS;
  const overlays = [];
  active.forEach((day, di) => {
    const y = HDR + di * ROW;
    day.periods.forEach(p => {
      if (!p.comment) return;
      const en = p.enter ? toMin(p.enter) : null;
      const ex = p.exit  ? toMin(p.exit)  : null;
      const sl = p.sleep ? toMin(p.sleep) : en;
      const wk = p.wake  ? toMin(p.wake)  : ex;
      const periodStart = en ?? sl;
      const periodEnd   = ex ?? wk;
      if (periodStart === null || periodEnd === null) return;
      const startSlot = (periodStart - 19 * 60 + 1440) % 1440;
      const endSlot   = (periodEnd   - 19 * 60 + 1440) % 1440;
      const width = ((endSlot - startSlot + SLOTS) % SLOTS) * PX;
      overlays.push({
        x: LW + startSlot * PX,
        y: y + 2,
        width: Math.max(width, 8),
        height: ROW - 4,
        comment: p.comment,
      });
    });
  });
  return overlays;
}

export default function ChartPanel({ days }) {
  const wrapRef = useRef(null);
  const containerRef = useRef(null);
  const [overlays, setOverlays] = useState([]);
  const [availW, setAvailW] = useState(800);

  useEffect(() => {
    const active = days.filter(d => d.periods.some(p => p.enter || p.sleep));
    if (!wrapRef.current) return;

    if (!active.length) {
      wrapRef.current.innerHTML = '<p style="color:var(--text2);font-size:13px;padding:20px 0">Introduce datos para ver el gráfico</p>';
      setOverlays([]);
      return;
    }

    const render = () => {
      const w = wrapRef.current?.clientWidth || 800;
      setAvailW(w);
      wrapRef.current.innerHTML = buildSvg(active, w);
      setOverlays(calcCommentOverlays(active, w));
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [days]);

  return (
    <div id="chart-panel">
      <div className="chart-legend">
        <div className="legend-item"><div className="legend-dot" style={{background:C_NIGHT_SLEEP}}></div>Noche dormida</div>
        <div className="legend-item"><div className="legend-dot" style={{background:C_NIGHT_AWAKE,border:'1px solid #4a6aaa'}}></div>Noche despierta</div>
        <div className="legend-item"><div className="legend-dot" style={{background:C_NAP_SLEEP}}></div>Siesta dormida</div>
        <div className="legend-item"><div className="legend-dot" style={{background:C_NAP_AWAKE,border:'1px solid #aa7838'}}></div>Siesta despierta</div>
      </div>
      <div style={{position:'relative'}} ref={containerRef}>
        <div id="chart-svg-wrap" ref={wrapRef}></div>
        {overlays.map((o, i) => (
          <div key={i} className="chart-comment-overlay" style={{left: o.x, top: o.y, width: o.width, height: o.height}}>
            <div className="chart-comment-dot" />
            <div className="chart-comment-tooltip">{o.comment}</div>
          </div>
        ))}
      </div>
      <div className="bottom-pad" />
    </div>
  );
}
