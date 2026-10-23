import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grih360.app',
  appName: 'Grih360',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#0F2937',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F2937',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SocialLogin: {
      providers: {
        google: true,
      },
    },
  },
};

export default config;
