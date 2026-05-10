import { useState, useEffect } from 'react';
import { getDays } from './api';
import DataPanel from './components/DataPanel';
import ChartPanel from './components/ChartPanel';
import './App.css';

export default function App() {
  const [days, setDays] = useState([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [tab, setTab] = useState('data');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDays().then(data => {
      setDays(data);
      setCurrentDay(data.length > 0 ? data.length - 1 : 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{padding:'24px',color:'var(--text2)'}}>Cargando…</div>;

  return (
    <div>
      <header className="app-header">
        <div className="header-moon">🌙</div>
        <div className="header-text">
          <h1>Amelia</h1>
          <p>Registro de sueño</p>
        </div>
      </header>

      <div className="tabs">
        <div className={`tab${tab === 'data' ? ' active' : ''}`} onClick={() => setTab('data')}>📝 Datos</div>
        <div className={`tab${tab === 'chart' ? ' active' : ''}`} onClick={() => setTab('chart')}>📊 Gráfico 24h</div>
      </div>

      {tab === 'data' && (
        <DataPanel
          days={days}
          setDays={setDays}
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
        />
      )}
      {tab === 'chart' && <ChartPanel days={days} />}
    </div>
  );
}
