/**
 * Google Maps browser key.
 *
 * Put the key in the project-root `.env` (or `.env.local`) as:
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
 *
 * Then restart `npm run dev`. Next.js only inlines `NEXT_PUBLIC_*` values
 * at startup, so a running server will not pick up a new key until restart.
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

const CALLBACK_NAME = "__cartsGoogleMapsReady";

type GoogleMapsWindow = Window &
  typeof globalThis & {
    google?: typeof google;
    [CALLBACK_NAME]?: () => void;
  };

let mapsPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(apiKey: string) {
  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Maps API key."));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  const mapsWindow = window as GoogleMapsWindow;
  if (mapsWindow.google?.maps) {
    return Promise.resolve(mapsWindow.google.maps);
  }

  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    mapsWindow[CALLBACK_NAME] = () => {
      if (!mapsWindow.google?.maps) {
        mapsPromise = null;
        reject(new Error("Google Maps loaded without a maps namespace."));
        return;
      }
      resolve(mapsWindow.google.maps);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error("Could not load the Google Maps script."));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}
