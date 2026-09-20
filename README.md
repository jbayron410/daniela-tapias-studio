# Daniela Tapias Studio — Página Web + Agendamiento

Sitio web profesional para peinadora con agendamiento en línea conectado a **Google Calendar** y **Google Sheets** vía **Google Apps Script**.

**Publicado en:** [www.danielatapias.com](https://www.danielatapias.com)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Google Apps Script (serverless) |
| Calendario | Google Calendar API |
| Base de datos | Google Sheets |
| Notificaciones | WhatsApp Cloud API (Meta) |
| Imágenes | Cloudinary |
| Auth (admin) | Firebase Authentication |
| Hosting | Vercel |

---

## Ejecutar el sitio

```bash
npm install
npm run dev
```

Abrir en el navegador: **http://localhost:5173**

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_APPS_SCRIPT_URL` | URL del deploy de Google Apps Script (backend) |
| `VITE_APPS_SCRIPT_KEY` | API key para autenticar las peticiones al Apps Script |
| `VITE_CLOUDINARY_BASE_URL` | Base de Cloudinary para servir imágenes |

### Configuración local

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

### Despliegue en Vercel

1. Ve a **Vercel Dashboard** → selecciona tu proyecto.
2. **Settings** → **Environment Variables**.
3. Agrega las variables de la tabla anterior.
4. En **Deployments** → botón **Redeploy** para que el build tome los nuevos valores.

---

## Arquitectura

```
Sitio React (Vite)
        │
        │ GET  ?action=availability&fecha=YYYY-MM-DD
        │ GET  ?action=blocks
        │ POST action=book / confirm / cancel
        ▼
Google Apps Script (backend)
        │
        ├── Google Calendar API (disponibilidad + crear/editar eventos)
        ├── Google Sheets (registro de citas)
        └── WhatsApp Cloud API (notificaciones a clienta y peinadora)
```

El backend completo vive en `google-apps-script/codigo.gs`. Se deploya como aplicación web desde el editor de Apps Script.

---

## Reglas de agenda

- Horario: **5:00 AM — 11:00 PM** (última cita empieza a las 10:00 PM).
- Servicios de **1 hora** (slots cada hora).
- Sin doble reservas: se verifica en Google Calendar en tiempo real.
- Disponibilidad desde hoy hasta 60 días.
- El formulario público muestra un select con todas las horas y sugiere la más cercana si la hora elegida ya está agendada (sin revelar la agenda completa).

---

## Estructura del proyecto

```
├── index.html
├── package.json
├── vite.config.js
├── google-apps-script/        ← Backend (Apps Script)
│   ├── codigo.gs
│   └── appsscript.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── data/services.js       ← Servicios, precios y galería
│   ├── api/
│   │   ├── n8n.js             ← Capa de comunicación con Apps Script
│   │   ├── sheets.js          ← CRUD de citas (admin)
│   │   ├── cloudinary.js      ← Helper de URLs de Cloudinary
│   │   └── gallery.js         ← Galería (Firestore)
│   ├── firebase/config.js     ← Configuración de Firebase
│   ├── context/AuthContext.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── admin.css
│   ├── pages/
│   │   ├── Agendar.jsx        ← Página de agendamiento
│   │   ├── MisRedes.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Login.jsx
│   │       └── AdminLayout.jsx
│   └── components/
│       ├── BookingForm.jsx    ← Formulario público de agendamiento
│       ├── Navbar.jsx
│       ├── Hero.jsx
│       ├── Gallery.jsx
│       ├── Services.jsx
│       ├── About.jsx
│       ├── SEO.jsx
│       ├── Footer.jsx
│       └── admin/
│           ├── AdminBookingModal.jsx
│           ├── BlockDayModal.jsx
│           ├── CalendarView.jsx
│           ├── CitasTable.jsx
│           ├── CitaDetailModal.jsx
│           ├── FilterBar.jsx
│           ├── StatsCards.jsx
│           ├── DashboardHeader.jsx
│           ├── ConfirmModal.jsx
│           ├── GalleryManager.jsx
│           ├── ImageUploader.jsx
│           └── helpers.js
```

---

## Imágenes (Cloudinary)

Las imágenes y videos se sirven desde **Cloudinary**. El helper `src/api/cloudinary.js` convierte las rutas guardadas en `src/data/services.js` en URLs de Cloudinary con normalización de caracteres especiales.

---

## Panel de admin

Acceso: `/admin/login` (autenticación con Firebase).

Desde el panel Daniela puede:
- Ver, confirmar y cancelar citas
- Agendar citas manualmente
- Bloquear días completos o franjas horarias
- Ver calendario (FullCalendar)
- Gestionar la galería de fotos
