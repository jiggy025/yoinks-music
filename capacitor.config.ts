import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yoinks.music',
  appName: 'Yoinks Music',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
