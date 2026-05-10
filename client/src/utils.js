export function toMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function fmtH(min) {
  if (min === null || min === undefined) return '—';
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return `${h}h${m > 0 ? m + 'm' : ''}`;
}

export function dur(a, b) {
  if (a === null || b === null) return 0;
  let d = b - a;
  if (d < 0) d += 1440;
  return d;
}

export function inPeriod(mid, en, ex) {
  if (en === null || ex === null) return false;
  if (ex < en) return mid >= en || mid < ex;
  return mid >= en && mid < ex;
}

export function calcTotals(periods) {
  let nightSleep = 0, siestaSleep = 0, tomas = 0;
  for (const p of periods) {
    const s = dur(toMin(p.sleep), toMin(p.wake));
    if (p.type === 'night') { nightSleep += s; if (p.toma === 'S') tomas++; }
    else siestaSleep += s;
  }
  return { nightSleep, siestaSleep, total: nightSleep + siestaSleep, tomas };
}

export function pillCls(val, lo) {
  if (!val && val !== 0) return 'neutral';
  const below = lo - val;
  if (below <= 0) return 'ok';
  if (below < 120) return 'warn';
  return 'bad';
}
