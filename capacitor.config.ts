import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mh.espressoflow',
  appName: 'Flowbean',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'espressoflow.vercel.app',
      'espressoflow-app.vercel.app',
      '*.supabase.co',
      'world.openfoodfacts.org',
    ],
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      overlaysWebView: false,
      backgroundColor: '#FAF7F2',
    },
  },
};

export default config;
