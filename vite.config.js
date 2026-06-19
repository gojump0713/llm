import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 단일 HTML 파일로 빌드 → 누구나 파일 하나만 열면 동작.
// 개발은 `npm run dev`, 배포용 단일 파일은 `npm run build` (dist/index.html).
export default defineConfig({
  // GitHub Pages 프로젝트 페이지(/llm/) 하위 경로 — 파비콘 등 루트상대 경로 보정.
  base: '/llm/',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    chunkSizeWarningLimit: 5000,
  },
});
