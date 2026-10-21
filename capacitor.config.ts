import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.getvantage.app",
  appName: "Stokka",
  webDir: "out",
  server: {
    // Set CAPACITOR_SERVER_URL in your environment before running cap sync.
    // Find your URL at vercel.com/dashboard → your project → Domains.
    url: process.env.CAPACITOR_SERVER_URL ?? "https://vantage.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#0F172A",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",           // dark content (Ink icons) on Cream background
      backgroundColor: "#FFF6EC",
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
