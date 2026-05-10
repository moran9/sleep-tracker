import { useState } from 'react';

export default function NewDayModal({ onConfirm, onCancel }) {
  const now = new Date();
  const [dd, setDd] = useState(String(now.getDate()).padStart(2, '0'));
  const [mm, setMm] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">¿Qué día es?</div>
        <div className="modal-selects">
          <select value={dd} onChange={e => setDd(e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span>/</span>
          <select value={mm} onChange={e => setMm(e.target.value)}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="modal-btns">
          <button className="modal-cancel" onClick={onCancel}>Cancelar</button>
          <button className="modal-confirm" onClick={() => onConfirm(`${dd}/${mm}`)}>Crear día</button>
        </div>
      </div>
    </div>
  );
}
