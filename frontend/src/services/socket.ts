import { io, Socket } from 'socket.io-client';

/**
 * WEB: shared Socket.IO connection to the chat gateway.
 *
 * One socket instance is reused across the app and across token changes.
 * Consumers (MessagesPage, usePresence) bind their listeners to whatever
 * `getSocket()` returned, and none of them declare the socket as an effect
 * dependency — so handing back a *different* instance silently strands those
 * listeners on a dead socket, leaving the UI permanently "reconnecting".
 *
 * Rotating the JWT therefore updates `auth` in place instead of recreating the
 * connection: the signature is only checked at handshake, so a live socket
 * stays valid, and the stored value is picked up by the next connect attempt.
 */
let socket: Socket | null = null;

/** Subject of the token the current socket was last authenticated with. */
let connectedSubject: string | null = null;

/** Consecutive server-initiated disconnects that were retried. */
let kickRetries = 0;

const MAX_KICK_RETRIES = 5;

function socketBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:5177';
}

/**
 * Read the `sub` claim without verifying it — this only distinguishes one
 * signed-in user from another client-side, never grants access.
 */
function tokenSubject(token: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json)?.sub ?? null;
  } catch {
    return null;
  }
}

export function getSocket(): Socket {
  const token = localStorage.getItem('accessToken');
  const subject = tokenSubject(token);

  if (socket) {
    // A rotated token for the *same* user is not a new identity — leave the
    // live connection alone. Only a different signed-in user requires a fresh
    // handshake, and even then the instance is reused so listeners survive.
    socket.auth = { token };
    if (subject !== connectedSubject) {
      connectedSubject = subject;
      socket.disconnect();
      socket.connect();
    } else if (!socket.connected && !socket.active) {
      socket.connect();
    }
    return socket;
  }

  socket = io(`${socketBaseUrl()}/chat`, {
    auth: { token },
    // websocket first, polling as fallback: a proxy that refuses the upgrade
    // would otherwise leave the chat permanently dead with no retry path.
    transports: ['websocket', 'polling'],
    reconnection: true,
    // Never give up. Ten attempts at one second apart is well inside a cold
    // start, after which socket.io stops retrying and the banner never clears.
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  connectedSubject = subject;
  kickRetries = 0;

  socket.on('connect', () => {
    kickRetries = 0;
  });

  socket.on('disconnect', (reason: string) => {
    // Transport failures are already retried by the engine. A server-initiated
    // disconnect is not — socket.io leaves it to the application, so without
    // this a single kick (gateway restart, brief status-cache miss) leaves the
    // chat disconnected until a full page reload.
    if (reason !== 'io server disconnect') return;
    if (!localStorage.getItem('accessToken')) return;
    if (kickRetries >= MAX_KICK_RETRIES) return;

    kickRetries += 1;
    const delay = 1500 * kickRetries;
    window.setTimeout(() => {
      if (socket && !socket.connected) socket.connect();
    }, delay);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectedSubject = null;
    kickRetries = 0;
  }
}

/** True when the shared socket exists and is currently connected. */
export function isSocketConnected(): boolean {
  return !!socket?.connected;
}

/**
 * Force an immediate connection attempt.
 *
 * Backs the "Reconnect" button shown when the banner has been up for a while,
 * giving the user a way out of a stalled retry loop without reloading.
 */
export function reconnectSocket(): void {
  const token = localStorage.getItem('accessToken');
  if (!token) return;
  getSocket().connect();
}

/**
 * Emit an event and wait for the gateway's acknowledgement.
 *
 * The gateway answers with { ok: true, data } or { ok: false, error }; this
 * unwraps that into a resolved value or a thrown Error so callers can use
 * ordinary try/catch. Rejects if no ack arrives, so a dropped connection
 * surfaces instead of leaving the caller waiting forever.
 */
export function emitWithAck<T = unknown>(
  event: string,
  payload: unknown,
  timeoutMs = 10000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const active = getSocket();

    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for "${event}"`));
    }, timeoutMs);

    active.emit(event, payload, (ack: any) => {
      clearTimeout(timer);

      if (ack && ack.ok) {
        resolve(ack.data as T);
        return;
      }

      reject(new Error(ack?.error || `"${event}" failed`));
    });
  });
}
