import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/admin/',
    plugins: [react()],
  
  // --- [추가됨] 서버 설정 ---
  server: {
    // 포트 번호를 3001로 지정함.
    port: 3001,
    // [중요] /api로 시작하는 모든 요청을
    // 백엔드 서버(http://localhost:8080)로 대신 보내주는 설정(프록시).
    // 이렇게 해야 CORS 오류 없이 API를 호출할 수 있음.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
  // --- [추가 완료] ---
})