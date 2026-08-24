const API_URL = import.meta.env.REACT_APP_SHEETS_API_URL;
const API_KEY = import.meta.env.REACT_APP_SHEETS_API_KEY;

export async function fetchCitas() {
  const res = await fetch(`${API_URL}?key=${API_KEY}`);
  if (!res.ok) throw new Error('Error al cargar citas');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function confirmCita(cita) {
  return fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
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
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: API_KEY,
      action: 'cancel',
      rowIndex: cita.rowIndex,
      id: cita.ID
    })
  });
}
