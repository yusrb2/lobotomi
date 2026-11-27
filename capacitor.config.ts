import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lobotomi.app',
  appName: 'Lobotomi',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#F6F2EA',
  },
};

export default config;
