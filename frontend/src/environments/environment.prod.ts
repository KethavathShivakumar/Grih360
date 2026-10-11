const isBrowser = typeof window !== 'undefined' &&
  window.location &&
  !window.location.protocol.startsWith('capacitor') &&
  window.location.hostname !== 'localhost';

export const environment = {
  production: true,
  siteUrl: 'https://grih360.vercel.app',
  apiUrl: isBrowser ? `${window.location.origin}/api/v1` : 'https://grih360.vercel.app/api/v1',
};

