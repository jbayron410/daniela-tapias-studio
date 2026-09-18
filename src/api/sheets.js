const API_URL =
  import.meta.env.DEV
    ? '/api/apps-script'
    : import.meta.env.VITE_APPS_SCRIPT_URL;
const API_KEY = import.meta.env.VITE_APPS_SCRIPT_KEY;

export async function fetchCitas() {
  const res = await fetch(`${API_URL}?key=${encodeURIComponent(API_KEY)}`);
  if (!res.ok) throw new Error('Error al cargar citas');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function confirmCita(cita) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: API_KEY,
      action: 'confirm',
      rowIndex: cita.rowIndex,
      id: cita.ID
    })
  });
}

export function cancelCita(cita) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: API_KEY,
      action: 'cancel',
      rowIndex: cita.rowIndex,
      id: cita.ID
    })
  });
}
