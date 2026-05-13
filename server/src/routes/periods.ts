import { Router } from 'express';
import type { Request, Response } from 'express';
import pool from '../db.ts';
import { rowToPeriod } from '../types.ts';
import type { Period, PeriodRow } from '../types.ts';

const router = Router({ mergeParams: true });

type PatchableFields = Partial<Pick<Period, 'enter' | 'sleep' | 'wake' | 'exit' | 'toma' | 'cunaFlag' | 'id'>>;

const COL_MAP: Record<keyof PatchableFields, string> = {
  enter: 'enter',
  sleep: 'sleep',
  wake: 'wake',
  exit: 'exit',
  toma: 'toma',
  cunaFlag: 'cuna_flag',
  id: 'period_id',
};

router.post('/', async (
  req: Request<{ dayId: string }, Period, Period & { sort_order: number }>,
  res: Response,
) => {
  const { dayId } = req.params;
  const { id, type, enter, sleep, wake, exit, toma, cunaFlag, sort_order } = req.body;

  const result = await pool.query<PeriodRow>(
    `INSERT INTO periods (day_id, period_id, type, enter, sleep, wake, exit, toma, cuna_flag, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [dayId, id, type, enter || null, sleep || null, wake || null, exit || null, toma ?? 'N', cunaFlag ?? null, sort_order ?? 0],
  );
  const row = result.rows[0];
  if (!row) { res.status(500).json({ error: 'Insert failed' }); return; }
  res.json(rowToPeriod(row));
});

router.patch('/:periodId', async (
  req: Request<{ dayId: string; periodId: string }, { ok: boolean }, PatchableFields>,
  res: Response,
) => {
  const { dayId, periodId } = req.params;
  const fields = req.body;

  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  let i = 1;

  for (const [key, val] of Object.entries(fields) as [keyof PatchableFields, string | undefined][]) {
    const col = COL_MAP[key];
    if (!col) continue;
    setClauses.push(`${col} = $${i++}`);
    values.push(val ?? null);
  }

  if (setClauses.length === 0) { res.json({ ok: true }); return; }

  values.push(dayId, periodId);
  await pool.query(
    `UPDATE periods SET ${setClauses.join(', ')} WHERE day_id = $${i++} AND period_id = $${i}`,
    values,
  );
  res.json({ ok: true });
});

router.delete('/:periodId', async (
  req: Request<{ dayId: string; periodId: string }>,
  res: Response,
) => {
  const { dayId, periodId } = req.params;
  await pool.query('DELETE FROM periods WHERE day_id = $1 AND period_id = $2', [dayId, periodId]);

  const remaining = await pool.query<PeriodRow>(
    'SELECT * FROM periods WHERE day_id = $1 ORDER BY sort_order',
    [dayId],
  );

  let ni = 1, si = 1;
  for (const p of remaining.rows) {
    const newId = p.type === 'night' ? `N${ni++}` : `S${si++}`;
    await pool.query('UPDATE periods SET period_id = $1 WHERE id = $2', [newId, p.id]);
  }

  res.json({ ok: true });
});

export default router;
