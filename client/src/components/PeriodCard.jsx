import { useState } from 'react';
import { dur, toMin, fmtH } from '../utils';
import { updatePeriod } from '../api';

function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function getDurText(p) {
  const parts = [];
  if (p.enter && p.sleep) parts.push('Concilia: ' + fmtH(dur(toMin(p.enter), toMin(p.sleep))));
  if (p.sleep && p.wake)  parts.push('Duerme: ' + fmtH(dur(toMin(p.sleep), toMin(p.wake))));
  if (p.wake && p.exit)   parts.push('En cuna despierta: ' + fmtH(dur(toMin(p.wake), toMin(p.exit))));
  return parts.join(' · ');
}

export default function PeriodCard({ period, dayId, defaultOpen, onDelete, onUpdate }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [showComment, setShowComment] = useState(!!period.comment);
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
            {[
              { field: 'enter', label: '⬇️ Acostada' },
              { field: 'sleep', label: '😴 Dormida' },
              { field: 'wake',  label: '😳 Despierta' },
              { field: 'exit',  label: '⬆️ Arriba' },
            ].map(({ field, label }) => (
              <div className="time-field" key={field}>
                <label>{label}</label>
                <div className="time-input-row">
                  <button className="btn-now" onClick={() => handleField(field, nowHHMM())}>🕐</button>
                  <input type="time" value={period[field]} onChange={e => handleField(field, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <div className="toggle-row">
            <button
              className={`chip-toggle${period.toma === 'S' ? ' act-sy' : period.toma === 'N' ? ' act-sn' : ''}`}
              onClick={() => handleField('toma', period.toma === 'S' ? 'N' : period.toma === 'N' ? '' : 'S')}
            >🍼 {period.toma === 'S' ? 'Sí' : period.toma === 'N' ? 'No' : '—'}</button>
            {[
              { val: 'C', label: 'Cuna' },
              { val: 'R', label: 'Carro' },
              { val: 'V', label: 'Cuna viaje' },
            ].map(({ val, label }) => (
              <button
                key={val}
                className={`chip-toggle${period.cunaFlag === val ? ' act-cy' : ''}`}
                onClick={() => handleField('cunaFlag', period.cunaFlag === val ? '' : val)}
              >{label}</button>
            ))}
            <button
              className={`chip-toggle${period.comment ? ' act-cy' : ''}`}
              onClick={() => setShowComment(v => !v)}
            >💬 Nota</button>
          </div>
          {showComment && (
            <textarea
              className="period-comment"
              placeholder="Comentario (opcional)…"
              value={period.comment || ''}
              onChange={e => handleField('comment', e.target.value)}
            />
          )}
          <div className="dur-display">{getDurText(period)}</div>
        </div>
      )}
    </div>
  );
}
