/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Appwrite endpoint (default: https://cloud.appwrite.io/v1) */
  readonly VITE_APPWRITE_ENDPOINT?: string;
  /** Appwrite project ID */
  readonly VITE_APPWRITE_PROJECT_ID?: string;
  /** Appwrite database ID (default: photobooth_db) */
  readonly VITE_APPWRITE_DATABASE_ID?: string;
  /** Collection IDs */
  readonly VITE_APPWRITE_COLLECTION_PROFILES?: string;
  readonly VITE_APPWRITE_COLLECTION_SUBSCRIPTIONS?: string;
  readonly VITE_APPWRITE_COLLECTION_PAYMENTS?: string;
  readonly VITE_APPWRITE_COLLECTION_DESKTOP_AUTH_CODES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
