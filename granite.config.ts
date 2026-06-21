import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'thedaysong',
  brand: {
    displayName: '뮤트',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/30619/d831515a-f107-4c45-abf3-b090ead04919.png',
  },
  web: {
    host: '192.168.0.109',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [
    {
      name: 'clipboard',
      access: 'read',
    },
  ],
  webViewProps: {
    type: 'partner',
  },
});
