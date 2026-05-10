import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cameraman.pro',
  appName: 'Cameraman Pro',
  webDir: 'dist',
  server: {
    url: 'https://cameraman-pro-2aa2b.web.app',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      // Set to false so the plugin does NOT manage Firebase auth state itself.
      // We manually call signInWithCredential() in AuthContext, keeping the
      // Firebase Web SDK as the single source of truth for auth state.
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;

