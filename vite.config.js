import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 단일 HTML 파일로 빌드 → 누구나 파일 하나만 열면 동작.
// 개발은 `npm run dev`, 배포용 단일 파일은 `npm run build` (dist/index.html).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    chunkSizeWarningLimit: 5000,
  },
});
