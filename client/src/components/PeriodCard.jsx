import { useState } from 'react';
import { dur, toMin, fmtH } from '../utils';
import { updatePeriod } from '../api';

function getDurText(p) {
  const parts = [];
  if (p.enter && p.sleep) parts.push('Concilia: ' + fmtH(dur(toMin(p.enter), toMin(p.sleep))));
  if (p.sleep && p.wake)  parts.push('Duerme: ' + fmtH(dur(toMin(p.sleep), toMin(p.wake))));
  if (p.wake && p.exit)   parts.push('En cuna despierta: ' + fmtH(dur(toMin(p.wake), toMin(p.exit))));
  return parts.join(' · ');
}

export default function PeriodCard({ period, dayId, onDelete, onUpdate }) {
  const [open, setOpen] = useState(false);
  const isN = period.type === 'night';

  const sleepMin = dur(toMin(period.sleep), toMin(period.wake));
  const summary = sleepMin > 0 ? fmtH(sleepMin) + ' dormida' : 'sin datos';

  async function handleField(field, value) {
    const updated = { ...period, [field]: value };
    onUpdate(updated);
    await updatePeriod(dayId, period.id, { [field]: value });
  }

  return (
    <div className={`period-card${open ? ' open' : ''}`}>
      <div className="period-header" onClick={() => setOpen(o => !o)}>
        <div className="period-label">
          <span className={`period-badge ${isN ? 'badge-night' : 'badge-siesta'}`}>{period.id}</span>
        </div>
        <div className="period-summary">{summary}</div>
        <button className="btn-del" onClick={e => { e.stopPropagation(); onDelete(period.id); }}>✕</button>
      </div>
      {open && (
        <div className="period-body">
          <div className="time-grid">
            <div className="time-field">
              <label>⬇️ Entra cuna</label>
              <input type="time" value={period.enter} onChange={e => handleField('enter', e.target.value)} />
            </div>
            <div className="time-field">
              <label>😴 Se duerme</label>
              <input type="time" value={period.sleep} onChange={e => handleField('sleep', e.target.value)} />
            </div>
            <div className="time-field">
              <label>😳 Se despierta</label>
              <input type="time" value={period.wake} onChange={e => handleField('wake', e.target.value)} />
            </div>
            <div className="time-field">
              <label>⬆️ Sale cuna</label>
              <input type="time" value={period.exit} onChange={e => handleField('exit', e.target.value)} />
            </div>
          </div>
          <div className="toggle-row">
            <span className="toggle-lbl">🍼 Toma:</span>
            <button className={`toggle-btn${period.toma === 'S' ? ' act-sy' : ''}`} onClick={() => handleField('toma', 'S')}>Sí</button>
            <button className={`toggle-btn${period.toma === 'N' ? ' act-sn' : ''}`} onClick={() => handleField('toma', 'N')}>No</button>
            {!isN && <>
              <span className="toggle-lbl" style={{marginLeft:'4px'}}>🛏️ Cuna:</span>
              <button className={`toggle-btn${period.cunaFlag === 'S' ? ' act-cy' : ''}`} onClick={() => handleField('cunaFlag', 'S')}>Sí</button>
              <button className={`toggle-btn${period.cunaFlag === 'N' ? ' act-cn' : ''}`} onClick={() => handleField('cunaFlag', 'N')}>No</button>
            </>}
          </div>
          <div className="dur-display">{getDurText(period)}</div>
        </div>
      )}
    </div>
  );
}
