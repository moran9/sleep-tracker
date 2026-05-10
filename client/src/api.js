const BASE = '/api';

export async function getDays() {
  const r = await fetch(`${BASE}/days`);
  return r.json();
}

export async function createDay(date) {
  const r = await fetch(`${BASE}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  });
  return r.json();
}

export async function deleteDay(id) {
  await fetch(`${BASE}/days/${id}`, { method: 'DELETE' });
}

export async function createPeriod(dayId, period, sortOrder) {
  const r = await fetch(`${BASE}/days/${dayId}/periods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...period, sort_order: sortOrder }),
  });
  return r.json();
}

export async function updatePeriod(dayId, periodId, fields) {
  await fetch(`${BASE}/days/${dayId}/periods/${periodId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

export async function deletePeriod(dayId, periodId) {
  const r = await fetch(`${BASE}/days/${dayId}/periods/${periodId}`, { method: 'DELETE' });
  return r.json();
}
