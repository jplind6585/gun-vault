import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strip console.* calls from production chunks
function stripConsole() {
  return {
    name: 'strip-console',
    renderChunk(code: string) {
      // Replace console.log/warn/info/debug/error calls with a no-op
      return code.replace(/\bconsole\.(log|warn|info|debug|error)\s*\(/g, '((()=>{}))(');
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'production' ? [stripConsole()] : [])],
}))
