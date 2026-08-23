# Daniela Tapias Studio — Página Web + Agendamiento

Sitio web para peinadora profesional con agendamiento en línea conectado a **Google Calendar** vía **n8n**.

## 🚀 Ejecutar el sitio

```bash
npm install
npm run dev
```

Abrir en el navegador: **http://localhost:5173**


## 🔐 Variables de entorno

El proyecto lee las siguientes variables (archivo `.env` o variables del entorno
del hosting):

| Variable | Descripción |
|---|---|
| `MAKE_AVAILABILITY_WEBHOOK_URL` | Webhook de Make que consulta los eventos ocupados del calendario |
| `MAKE_BOOKING_WEBHOOK_URL` | Webhook de Make que crea la reserva (inserta el evento en Google Calendar) |
| `CLOUDINARY_BASE_URL` | Base de Cloudinary para servir las imágenes del portal, ej: `https://res.cloudinary.com/hwzcg49k/image/upload` |

### Configuración local

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

### Despliegue en Vercel

En Vercel, agrega las **mismas variables** en el proyecto:

1. Ve a **Vercel Dashboard** → selecciona tu proyecto.
2. **Settings** → **Environment Variables**.
3. Agrega las tres variables de la tabla anterior.
4. En **Deployments** → botón **Redeploy** para que el build tome los nuevos valores.

> **Importante:** Vite solo expone a `import.meta.env` las variables con prefijo
> `VITE_`. Para usar estos nombres sin prefijo, `vite.config.js` los inyecta
> manualmente desde el `.env` / variables del entorno en tiempo de build.

### Imágenes (Cloudinary)

Las imágenes y videos del portal se sirven desde **Cloudinary**. El helper
`src/api/cloudinary.js` convierte las rutas locales (ej. `/sociales/nombre.jpg`)
en URLs de Cloudinary aplicando la normalización de `[` y `]` → `_` que hace
Cloudinary al guardar los archivos. Ejemplos:

```
/sociales/2024-08-20_10-48-58_[C-5bgaiAcKk].jpg
  -> https://res.cloudinary.com/hwzcg49k/image/upload/sociales/2024-08-20_10-48-58__C-5bgaiAcKk.jpg

/sociales/2024-12-11_09-29-25_[DDcQOoexFHx]_01.jpg
  -> https://res.cloudinary.com/hwzcg49k/image/upload/sociales/2024-12-11_09-29-25__DDcQOoexFHx__01.jpg
```

---

## 🏗️ Arquitectura

```
Sitio React (Vite, port 5173)
        │
        │ GET /webhook/daniela-availability?date=2026-07-31
        │ POST /webhook/daniela-booking
        ▼
    n8n (localhost:5678)
        │
        ├── Google Calendar API (disponibilidad + crear eventos)
        └── Gmail API (confirmación al cliente + aviso a la peinadora)
```

---

## ☁️ PASO 1: Configurar Google Cloud (una sola vez)

### 1.1 Crear el proyecto

1. Entra a [console.cloud.google.com](https://console.cloud.google.com) con la cuenta de **Gmail de Daniela** (o la cuenta que uses para el calendario).
2. Haz clic en el selector de proyecto (arriba izquierda, junto al logo) → **Nuevo proyecto**.
3. Nómbralo: `daniela-tapias-studio` → **Crear**.

### 1.2 Habilitar las APIs

1. Con el proyecto seleccionado, ve a **APIs & Services** → **Library**.
2. Busca y habilita **Google Calendar API** → **Enable**.
3. Busca y habilita **Gmail API** → **Enable**.

### 1.3 Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials** → **+ Crear credenciales** → **ID de cliente OAuth**.
2. Si te pide configurar la pantalla de consentimiento primero:
   - Ve a **Pantalla de consentimiento** → **Empezar**.
   - Universo: **Externo** → Crear.
   - Nombre de la app: `Daniela Tapias Studio`.
   - Correo de asistencia: el de Daniela.
   - Correo del desarrollador: el mismo.
   - **Guardar y continuar** hasta terminar (scopes: no agregar, usuarios de prueba: no agregar por ahora, en modo "Testing" no requiere).
3. Ahora sí: **+ Crear credenciales** → **ID de cliente OAuth**.
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `n8n-daniela`.
   - **URIs de redireccionamiento autorizados**: agrega:
     - `http://localhost:5678/rest/oauth2-credential/callback`
   - **Crear**.
4. Copia el **Client ID** y el **Client Secret** (aparecen en un modal, puedes descargarlos).

### 1.4 (Opcional, para producción) Publicar la app

Con la pantalla de consentimiento en modo **Testing**, las credenciales solo funcionan con cuentas marcadas como "usuarios de prueba" (hasta 100). Para eliminar esa restricción:
- Ve a **Pantalla de consentimiento** → **Publicar app** → Confirma.
- Esto permite a cualquier cliente autorizarse (solo necesitas autorizar UNA vez la cuenta de Daniela).

---

## 🔧 PASO 2: configurar credenciales en n8n

### 2.1 Credencial de Google Calendar

1. Abre n8n: **http://localhost:5678**
2. Ve a **Credentials** → **+ Add Credential** → busca **Google Calendar OAuth2 API**.
3. Completa:
   - **Client ID**: el de Google Cloud.
   - **Client Secret**: el de Google Cloud.
4. **Sign in with Google** → autoriza con la cuenta de Daniela (acepta los permisos).
5. Asegúrate de que diga "Connected".

### 2.2 Credencial de Gmail

1. **Credentials** → **+ Add Credential** → busca **Gmail OAuth2 API**.
2. Pon el mismo **Client ID** y **Client Secret**.
3. **Sign in with Google** → autoriza (esta vez también pide permiso para enviar correos).
4. "Connected".

> **Nota:** Si la conexión falla, revisa que la URI de redirección en Google Cloud esté exactamente como: `http://localhost:5678/rest/oauth2-credential/callback`.

---

## 🔄 PASO 3: Importar los workflows en n8n

Los archivos de workflow están en la carpeta **`n8n-workflows/`**:

| Archivo | Webhook | Función |
|---|---|---|
| `daniela-availability.json` | `GET /daniela-availability?date=YYYY-MM-DD` | Devuelve slots libres del día |
| `daniela-booking.json` | `POST /daniela-booking` | Verifica, crea evento en Calendar y envía email |

### Importar:

1. En n8n: **Workflows** → **⋮** → **Import from File** → selecciona cada JSON.
2. Abre cada workflow e **identifica los nodos de Google Calendar / Gmail** y asígnales la credencial que creaste.
3. En el nodo de Google Calendar, selecciona el **calendar ID** correcto (el de Daniela).
4. En el workflow de reserva, el nodo **"Aviso a la peinadora"** tiene el correo `EMAIL_DE_DANIELA@GMAIL.COM` — cámbialo al correo real de Daniela.
5. En los nodos de **Gmail**, el correo que se usa para enviar será el de la cuenta de Daniela autorizada.
6. **Activa** ambos workflows (toggle en la parte superior).

### Verificar los webhooks:

En "Workflows" → click derecho sobre el nodo "Webhook" → **Listen for test event**. Luego prueba:

```bash
# Disponibilidad (debe responder {"slots": [...]})
curl "http://localhost:5678/webhook/daniela-availability?date=2026-08-01"

# Reserva
curl -X POST http://localhost:5678/webhook/daniela-booking ^
  -H "Content-Type: application/json" ^
  -d "{\"servicio\":\"Sociales\",\"precio\":60000,\"nombre_completo\":\"Test\",\"whatsapp\":\"3001234567\",\"email\":\"test@test.com\",\"a_domicilio\":true,\"detalles_domicilio\":\"Calle 1 #2-3, Barrio Centro\",\"requiere_maquillaje\":false,\"notas\":\"\",\"fecha_inicio\":\"2026-08-01T14:00:00-05:00\",\"fecha_fin\":\"2026-08-01T15:00:00-05:00\"}"
```

---

## 🌐 PASO 4: Conectar el sitio con n8n

El sitio ya apunta a `http://localhost:5678/webhook/...`.

**Para pruebas locales**, si el sitio se abre desde el mismo computador donde corre n8n, funciona directo.

**Para que funcione en el móvil o para clientes (producción):**
1. El túnel de Cloudflare que ya tienes: `https://cassette-librarian-rotation-lemon.trycloudflare.com`
2. En `src/api/n8n.js`, cambia:
   ```js
   const N8N_BASE_URL = 'https://cassette-librarian-rotation-lemon.trycloudflare.com/webhook';
   ```
   (La URL del túnel cambia cada vez que reinicias el túnel.)
3. Cuando compres el dominio, apunta túnel de Cloudflare al dominio para que la URL sea fija.

> ⚠️ **Importante:** n8n en Cloudflare expone su interfaz. Recomendable crear una API key en n8n y/o usar un túnel solo para webhooks cuando se vaya a producción.

---

## 💰 Precios (actualmente valores random)

| Servicio | Precio COP | Duración |
|---|---|---|
| Sociales | $60.000 | 1 hora |
| Novias | $350.000 | 1 hora |
| Quinceañeras | $250.000 | 1 hora |
| Personalizado | $40.000 | 1 hora |

> El **servicio a domicilio** no tiene recargo fijo: el valor depende de la
> ubicación del cliente y se confirma antes de agendar.

Todos están en `src/data/services.js` — edita este archivo para cambiar precios.

---

## 📅 Reglas de agenda

- Horario: **5:00 AM — 11:00 PM** (última cita empieza a las 10:00 PM).
- Servicios de **1 hora** (slots cada hora).
- **Sin doble reservas**: verifica en Google Calendar en tiempo real.
- Disponibilidad desde hoy hasta 60 días.

---

## 📁 Estructura del proyecto

```
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── n8n-workflows/           ← Workflows para importar
│   ├── daniela-availability.json
│   └── daniela-booking.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── data/services.js     ← Precios y galería
│   ├── api/n8n.js           ← Conexión con n8n
│   ├── styles/global.css
│   └── components/
│       ├── Navbar.jsx
│       ├── Hero.jsx
│       ├── Gallery.jsx
│       ├── Services.jsx
│       ├── About.jsx
│       ├── BookingForm.jsx
│       └── Footer.jsx
└── assets/                  ← Imágenes y videos (publicados tal cual)