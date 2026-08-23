import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// NOTA: Vite solo expone a `import.meta.env` las variables que empiezan con
// `VITE_`. Para poder usar nombres sin prefijo (MAKE_...) las inyectamos
// manualmente con `define`, cargando el archivo `.env` en tiempo de build.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const define = {}
  for (const key of [
    'MAKE_AVAILABILITY_WEBHOOK_URL',
    'MAKE_BOOKING_WEBHOOK_URL',
    'CLOUDINARY_BASE_URL'
  ]) {
    define[`import.meta.env.${key}`] = JSON.stringify(env[key] || '')
  }

  return {
    plugins: [react()],
    publicDir: 'assets',
    define,
    server: {
      port: 5173,
      host: true
    }
  }
})