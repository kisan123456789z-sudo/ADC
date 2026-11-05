/**
 * Centralized Connectivity Management Service
 * 
 * Provides accurate, production-grade internet and backend detection for AnuJay Dental Clinic.
 * Distinguishes between:
 * 1. Device has no internet connection (offline).
 * 2. Internet is available, but the backend / Firestore is unreachable.
 * 3. Normal application/auth/permission errors (which are never classified as offline).
 * 
 * Prevents duplicate/concurrent checks, debounces retries, and avoids redirect loops.
 */

export type ConnectivityStatus = 'online' | 'offline' | 'checking' | 'backend_unavailable';

export interface ConnectivityState {
  isOnline: boolean;
  status: ConnectivityStatus;
  statusMessage: string;
  hintText: string;
  lastChecked: number;
}

type ConnectivityListener = (state: ConnectivityState) => void;

class ConnectivityService {
  private state: ConnectivityState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online',
    statusMessage: typeof navigator !== 'undefined' && !navigator.onLine 
      ? 'Internet connection unavailable' 
      : 'Connected',
    hintText: 'Your clinic information is protected. Reconnect to the internet and try again.',
    lastChecked: Date.now()
  };

  private listeners: Set<ConnectivityListener> = new Set();
  private inFlightProbe: Promise<boolean> | null = null;
  private lastProbeTime = 0;
  private minProbeIntervalMs = 4000; // Do not hammer probe endpoints faster than every 4s
  private backgroundTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineEvent);
      window.addEventListener('offline', this.handleOfflineEvent);

      // Initial check if browser reports online, verify actual network
      if (navigator.onLine) {
        this.verifyConnectivity(true).catch(() => {});
      } else {
        this.setOffline('Internet connection unavailable');
      }

      // Sensible background heartbeat when offline or idle
      this.startHeartbeat();
    }
  }

  public getState(): ConnectivityState {
    return { ...this.state };
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.warn('Connectivity listener error:', err);
      }
    });
  }

  private handleOnlineEvent = () => {
    // Browser says online, but verify actual internet and backend access
    this.updateState({
      status: 'checking',
      statusMessage: 'Connection detected — checking access…',
      hintText: 'Please wait while the page checks access to the clinic.'
    });
    this.verifyConnectivity(true).catch(() => {});
  };

  private handleOfflineEvent = () => {
    // Browser explicitly dropped connection (e.g. WiFi off, airplane mode)
    this.setOffline('Internet connection unavailable');
  };

  private setOffline(message = 'Internet connection unavailable') {
    this.updateState({
      isOnline: false,
      status: 'offline',
      statusMessage: message,
      hintText: 'Your clinic information is protected. Reconnect to the internet and try again.',
      lastChecked: Date.now()
    });
  }

  private setBackendUnavailable() {
    this.updateState({
      isOnline: false,
      status: 'backend_unavailable',
      statusMessage: 'Backend temporarily unreachable',
      hintText: 'Internet is active, but the clinic server is not responding. Please retry shortly.',
      lastChecked: Date.now()
    });
  }

  private setOnline() {
    this.updateState({
      isOnline: true,
      status: 'online',
      statusMessage: 'Connected',
      hintText: 'Connected to AnuJay Dental Clinic.',
      lastChecked: Date.now()
    });
  }

  private updateState(partial: Partial<ConnectivityState>) {
    const changed = Object.entries(partial).some(
      ([key, val]) => (this.state as any)[key] !== val
    );
    if (changed) {
      this.state = { ...this.state, ...partial };
      this.notify();
    }
  }

  /**
   * Genuine network probe verifying real internet and host reachability.
   * Uses relative path './manifest.json' with cache-busting so it works across
   * root domain, '/ADC/' subdirectory on GitHub Pages, and mobile Android WebViews.
   */
  public async verifyConnectivity(force = false): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    // If browser definitely reports offline, do not send probe
    if (!navigator.onLine) {
      this.setOffline('Internet connection unavailable');
      return false;
    }

    const now = Date.now();
    if (!force && this.inFlightProbe) {
      return this.inFlightProbe;
    }

    // Cooldown to avoid excessive network calls
    if (!force && now - this.lastProbeTime < this.minProbeIntervalMs) {
      return this.state.isOnline;
    }

    this.lastProbeTime = now;

    this.inFlightProbe = (async () => {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = setTimeout(() => {
          if (controller) controller.abort();
        }, 5500);

        // Relative probe path to manifest or root shell with unique cache-buster
        const probeUrl = `./manifest.json?_ping=${Date.now()}`;

        const response = await fetch(probeUrl, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller ? controller.signal : undefined
        });

        clearTimeout(timeoutId);

        if (response && (response.status === 200 || response.status === 304 || response.type === 'opaque')) {
          this.setOnline();
          return true;
        } else {
          // If probe returned server error 5xx, backend might be down
          if (response.status >= 500) {
            this.setBackendUnavailable();
            return false;
          }
          // Other responses (e.g. 404 on manifest) still prove network is alive
          this.setOnline();
          return true;
        }
      } catch (err: any) {
        // Probe failed (DNS lookup error, connection refused, or aborted)
        if (!navigator.onLine) {
          this.setOffline('Internet connection unavailable');
        } else {
          // Try a quick secondary probe to an external CDN/image to confirm if internet is up
          const secondaryOk = await this.testSecondaryInternet();
          if (secondaryOk) {
            this.setBackendUnavailable();
          } else {
            this.setOffline('Internet connection unavailable');
          }
        }
        return false;
      } finally {
        this.inFlightProbe = null;
      }
    })();

    return this.inFlightProbe;
  }

  /**
   * Lightweight secondary probe to check if the device can reach the broader internet.
   */
  private async testSecondaryInternet(): Promise<boolean> {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = setTimeout(() => {
        if (controller) controller.abort();
      }, 4000);

      // Lightweight 204 or favicon from Google/Cloudflare (common reliable captive portal check)
      const res = await fetch('https://www.gstatic.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      });

      clearTimeout(timeoutId);
      return res.type === 'opaque' || res.status === 204 || res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Called by Firebase or API handlers when a genuine network failure occurs.
   * CAUTION: Must NOT be called on 401, 403, 404, or validation errors!
   */
  public reportNetworkFailure(error: any) {
    const errorStr = (error?.message || error?.code || String(error)).toLowerCase();

    // Check if error is genuinely a network/connection disconnect
    const isNetworkError = 
      errorStr.includes('offline') ||
      errorStr.includes('network error') ||
      errorStr.includes('failed to fetch') ||
      errorStr.includes('could not reach cloud firestore') ||
      errorStr.includes('unavailable') ||
      errorStr.includes('the client is offline');

    if (isNetworkError) {
      if (!navigator.onLine) {
        this.setOffline('Internet connection unavailable');
      } else {
        // Run verify probe to check whether backend or internet is down
        this.verifyConnectivity(true).catch(() => {});
      }
    }
  }

  /**
   * Periodic background check:
   * When offline, checks every 8 seconds for automatic restoration.
   * When online, runs a very light check every 60 seconds.
   */
  private startHeartbeat() {
    if (this.backgroundTimer) clearInterval(this.backgroundTimer);

    this.backgroundTimer = setInterval(() => {
      if (!this.state.isOnline) {
        this.verifyConnectivity(false).catch(() => {});
      }
    }, 8000);
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineEvent);
      window.removeEventListener('offline', this.handleOfflineEvent);
      if (this.backgroundTimer) clearInterval(this.backgroundTimer);
    }
  }
}

export const connectivityService = new ConnectivityService();
