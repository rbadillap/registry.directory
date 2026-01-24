import type { FileSystemTree } from "@webcontainer/api"

export function createViteTemplate(
  dependencies: Record<string, string> = {}
): FileSystemTree {
  const packageJson = {
    name: "preview",
    type: "module",
    scripts: {
      dev: "vite",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      ...dependencies,
    },
    devDependencies: {
      vite: "^5.0.0",
      "@vitejs/plugin-react": "^4.0.0",
    },
  }

  return {
    "package.json": {
      file: {
        contents: JSON.stringify(packageJson, null, 2),
      },
    },
    "vite.config.js": {
      file: {
        contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
`.trim(),
      },
    },
    "index.html": {
      file: {
        contents: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`.trim(),
      },
    },
    src: {
      directory: {
        "main.jsx": {
          file: {
            contents: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`.trim(),
          },
        },
      },
    },
  }
}
