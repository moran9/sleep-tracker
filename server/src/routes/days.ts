import { Router, Request, Response } from 'express';
import pool from '../db';
import { Day, DayRow, PeriodRow, rowToPeriod } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const daysRes = await pool.query<DayRow>('SELECT * FROM days ORDER BY id');
  const periodsRes = await pool.query<PeriodRow>('SELECT * FROM periods ORDER BY day_id, sort_order');

  const days: Day[] = daysRes.rows.map(day => ({
    id: day.id,
    date: day.date,
    periods: periodsRes.rows
      .filter(p => p.day_id === day.id)
      .map(rowToPeriod),
  }));

  res.json(days);
});

router.post('/', async (req: Request<object, Day, { date: string }>, res: Response) => {
  const { date } = req.body;
  const result = await pool.query<DayRow>(
    'INSERT INTO days (date) VALUES ($1) RETURNING *',
    [date],
  );
  const row = result.rows[0];
  if (!row) { res.status(500).json({ error: 'Insert failed' }); return; }
  res.json({ id: row.id, date: row.date, periods: [] });
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  await pool.query('DELETE FROM days WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
