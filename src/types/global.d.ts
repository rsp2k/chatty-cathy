// Global type declarations for PWA
declare global {
  interface Window {
    enableNotifications: () => Promise<void>;
    sendTestNotification: () => Promise<void>;
  }
}

export {};
