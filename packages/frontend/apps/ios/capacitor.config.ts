import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'app.affine.pro',
  appName: 'AFFiNE',
  webDir: 'dist',
  ios: {
    path: '.',
  },
  server: {
    // url: 'http://localhost:8080',
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: KeyboardResize.Native,
    },
  },
};

export default config;
