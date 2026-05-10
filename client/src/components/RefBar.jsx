import { calcTotals, fmtH, pillCls } from '../utils';

export default function RefBar({ periods }) {
  const { nightSleep, siestaSleep, total, tomas } = calcTotals(periods);

  const tomasCls = tomas > 2 ? 'bad' : 'ok';

  return (
    <div className="ref-bar">
      <div className="ref-pill">🌙 Nocturno <span className={pillCls(nightSleep, 600)}>{nightSleep > 0 ? fmtH(nightSleep) : '—'}</span></div>
      <div className="ref-pill">💤 Siestas <span className={pillCls(siestaSleep, 180)}>{siestaSleep > 0 ? fmtH(siestaSleep) : '—'}</span></div>
      <div className="ref-pill">⏱ Total <span className={pillCls(total, 840)}>{total > 0 ? fmtH(total) : '—'}</span></div>
      <div className="ref-pill">🍼 Tomas noche <span className={tomasCls}>{tomas || '—'}</span></div>
    </div>
  );
}
