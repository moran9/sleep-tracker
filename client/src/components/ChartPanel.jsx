import { useEffect, useRef } from 'react';
import { toMin, dur, inPeriod } from '../utils';

const SLOTS = 1440;
function slotMin(s) { return (19 * 60 + s) % 1440; }

function getCellColor(day, slot) {
  const mid = slotMin(slot);
  for (const p of day.periods) {
    const en = toMin(p.enter), ex = toMin(p.exit), sl = toMin(p.sleep), wk = toMin(p.wake);
    if (!inPeriod(mid, en, ex)) continue;
    const asleep = inPeriod(mid, sl, wk);
    if (p.type === 'night') return asleep ? '#7ec8a4' : '#e8b87a';
    if (p.type === 'siesta') return asleep ? (p.cunaFlag === 'S' ? '#7ec8a4' : '#b8a0d8') : '#e8b87a';
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
  const ROW = 24, LW = 44, HDR = 50, TW = 190;
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
      const isSleep = (bg === '#7ec8a4' || bg === '#b8a0d8');
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

export default function ChartPanel({ days }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const active = days.filter(d => d.periods.some(p => p.enter));
    if (!wrapRef.current) return;

    if (!active.length) {
      wrapRef.current.innerHTML = '<p style="color:var(--text2);font-size:13px;padding:20px 0">Introduce datos para ver el gráfico</p>';
      return;
    }

    const render = () => {
      const availW = wrapRef.current?.clientWidth || 800;
      wrapRef.current.innerHTML = buildSvg(active, availW);
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [days]);

  return (
    <div id="chart-panel">
      <div className="chart-legend">
        <div className="legend-item"><div className="legend-dot" style={{background:'#7ec8a4'}}></div>Dormida en cuna</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#b8a0d8'}}></div>Dormida fuera cuna</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#e8b87a'}}></div>Cuna despierta</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#181b26',border:'1px solid #2a2f48'}}></div>Fuera cuna</div>
      </div>
      <div id="chart-svg-wrap" ref={wrapRef}></div>
      <div className="bottom-pad" />
    </div>
  );
}
