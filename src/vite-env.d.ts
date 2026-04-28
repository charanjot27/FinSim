/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTIONS_EMULATOR?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FINNHUB_KEY?: string;
  readonly VITE_ALPHAVANTAGE_KEY?: string;
  readonly VITE_ALPHA_VANTAGE_KEY?: string;
  readonly VITE_NEWSAPI_KEY?: string;
  readonly VITE_MARKETAUX_KEY?: string;
  readonly VITE_FRED_KEY?: string;
  readonly VITE_ETHERSCAN_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
