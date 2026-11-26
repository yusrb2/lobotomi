import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lobotomi.app',
  appName: 'Lobotomi',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#F7F1E5',
  },
};

export default config;
