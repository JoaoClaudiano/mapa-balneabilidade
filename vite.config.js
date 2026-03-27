import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mapa-balneabilidade/'  // substitua pelo nome do seu repositório
})
