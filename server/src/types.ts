export type PeriodType = 'night' | 'siesta';
export type TomaFlag = 'S' | 'N';

export interface Period {
  id: string;
  type: PeriodType;
  enter: string;
  sleep: string;
  wake: string;
  exit: string;
  toma: TomaFlag;
  cunaFlag?: string;
}

export interface Day {
  id: number;
  date: string;
  periods: Period[];
}

export interface DayRow {
  id: number;
  date: string;
}

export interface PeriodRow {
  id: number;
  day_id: number;
  period_id: string;
  type: PeriodType;
  enter: string | null;
  sleep: string | null;
  wake: string | null;
  exit: string | null;
  toma: TomaFlag;
  cuna_flag: string | null;
  sort_order: number;
}

export function rowToPeriod(p: PeriodRow): Period {
  return {
    id: p.period_id,
    type: p.type,
    enter: p.enter ?? '',
    sleep: p.sleep ?? '',
    wake: p.wake ?? '',
    exit: p.exit ?? '',
    toma: p.toma,
    ...(p.type === 'siesta' ? { cunaFlag: p.cuna_flag ?? 'S' } : {}),
  };
}
