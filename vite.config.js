import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 같은 네트워크의 태블릿에서 접속 가능하도록
    port: 5173,
  },
})
