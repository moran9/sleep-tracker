import { useState, useRef, useEffect } from 'react';
import { createDay, createPeriod, deletePeriod } from '../api';
import PeriodCard from './PeriodCard';
import RefBar from './RefBar';
import NewDayModal from './NewDayModal';

export default function DataPanel({ days, setDays, currentDay, setCurrentDay }) {
  const [showModal, setShowModal] = useState(false);
  const chipRefs = useRef([]);

  const day = days[currentDay];

  useEffect(() => {
    chipRefs.current[currentDay]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentDay]);

  async function handleNewDay(date) {
    setShowModal(false);
    const newDay = await createDay(date);
    setDays(prev => {
      const updated = [...prev, newDay];
      setCurrentDay(updated.length - 1);
      return updated;
    });
  }

  function nextPeriodId(type) {
    if (!day) return type === 'night' ? 'N1' : 'S1';
    const count = day.periods.filter(p => p.type === type).length;
    return (type === 'night' ? 'N' : 'S') + (count + 1);
  }

  async function handleAddPeriod(type) {
    if (!day) return;
    const id = nextPeriodId(type);
    const newPeriod = {
      id, type,
      enter: '', sleep: '', wake: '', exit: '',
      toma: 'N',
      ...(type === 'siesta' ? { cunaFlag: 'S' } : {}),
    };
    const sortOrder = day.periods.length;
    const created = await createPeriod(day.id, newPeriod, sortOrder);
    setDays(prev => prev.map((d, i) =>
      i === currentDay ? { ...d, periods: [...d.periods, created] } : d
    ));
  }

  async function handleDeletePeriod(periodId) {
    if (!day) return;
    await deletePeriod(day.id, periodId);
    // Renumber locally
    const remaining = day.periods.filter(p => p.id !== periodId);
    let ni = 1, si = 1;
    const renumbered = remaining.map(p => ({
      ...p,
      id: p.type === 'night' ? `N${ni++}` : `S${si++}`,
    }));
    setDays(prev => prev.map((d, i) =>
      i === currentDay ? { ...d, periods: renumbered } : d
    ));
  }

  function handleUpdatePeriod(updated) {
    setDays(prev => prev.map((d, i) =>
      i === currentDay
        ? { ...d, periods: d.periods.map(p => p.id === updated.id ? updated : p) }
        : d
    ));
  }

  const nightPeriods = day?.periods.filter(p => p.type === 'night') ?? [];
  const siestaPeriods = day?.periods.filter(p => p.type === 'siesta') ?? [];

  return (
    <div>
      <div className="day-selector-bar">
        {days.map((d, i) => (
          <button
            key={d.id}
            ref={el => chipRefs.current[i] = el}
            className={`day-chip${i === currentDay ? ' active' : ''}`}
            onClick={() => setCurrentDay(i)}
          >
            {d.date || `Día ${i + 1}`}
          </button>
        ))}
        <button className="btn-add-day" onClick={() => setShowModal(true)}>+ Día</button>
      </div>

      {day && <RefBar periods={day.periods} />}

      {!day ? (
        <p style={{padding:'24px 16px',color:'var(--text2)',fontSize:'13px'}}>
          Pulsa <b>+ Día</b> para empezar a registrar
        </p>
      ) : (
        <>
          <div className="period-section">
            <div className="section-header">
              <h3>🌙 Bloques nocturnos</h3>
              <div className="section-line" />
              <button className="btn-add" onClick={() => handleAddPeriod('night')}>+ Añadir</button>
            </div>
            {nightPeriods.map(p => (
              <PeriodCard
                key={p.id}
                period={p}
                dayId={day.id}
                onDelete={handleDeletePeriod}
                onUpdate={handleUpdatePeriod}
              />
            ))}
          </div>

          <div className="period-section">
            <div className="section-header">
              <h3>☀️ Siestas</h3>
              <div className="section-line" />
              <button className="btn-add" onClick={() => handleAddPeriod('siesta')}>+ Añadir</button>
            </div>
            {siestaPeriods.map(p => (
              <PeriodCard
                key={p.id}
                period={p}
                dayId={day.id}
                onDelete={handleDeletePeriod}
                onUpdate={handleUpdatePeriod}
              />
            ))}
          </div>
        </>
      )}

      <div className="bottom-pad" />

      {showModal && (
        <NewDayModal
          onConfirm={handleNewDay}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
