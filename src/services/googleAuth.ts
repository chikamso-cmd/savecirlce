// Google sign-in through Google Identity Services, loaded straight from Google (no npm package).
// Uses the popup auth-code flow: the browser gets a one-time code, and the API exchanges it
// for the user's verified Google profile. The client secret stays on the server.

interface CodeResponse {
  code?: string;
  error?: string;
  error_description?: string;
}

interface CodeClient {
  requestCode: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            callback: (res: CodeResponse) => void;
            error_callback?: (err: { type: string }) => void;
          }) => CodeClient;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

let scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(
        new Error("Couldn't reach Google. Check your connection and try again."),
      );
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Start loading early (e.g. when the auth screen mounts) so the popup opens instantly on click
export const preloadGoogle = () => {
  if (GOOGLE_CLIENT_ID) loadGis().catch(() => {});
};

export async function requestGoogleCode(): Promise<string> {
  if (!GOOGLE_CLIENT_ID)
    throw new Error(
      "Google sign-in isn't set up yet. Add VITE_GOOGLE_CLIENT_ID to .env.local.",
    );
  await loadGis();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (res) => {
        if (res.code) resolve(res.code);
        else
          reject(
            new Error(res.error_description ?? "Google sign-in was cancelled."),
          );
      },
      error_callback: (err) =>
        reject(
          new Error(
            err.type === "popup_failed_to_open"
              ? "Your browser blocked the Google pop-up. Allow pop-ups and try again."
              : "Google sign-in was cancelled.",
          ),
        ),
    });
    client.requestCode();
  });
}
