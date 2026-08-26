import { io, Socket } from 'socket.io-client';

/**
 * WEB: shared Socket.IO connection to the chat gateway.
 *
 * One socket is reused across the app. The auth token is read at connect time
 * rather than captured once, so a fresh login always hands the gateway the
 * current token.
 */
let socket: Socket | null = null;

/** The token the live socket was opened with, so a change can be detected. */
let connectedWithToken: string | null = null;

function socketBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:5177';
}

export function getSocket(): Socket {
  const token = localStorage.getItem('accessToken');

  // A socket authenticated with a stale token would keep failing its
  // handshake, so replace it when the stored token changes (re-login, refresh).
  if (socket && connectedWithToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(`${socketBaseUrl()}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    connectedWithToken = token;
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectedWithToken = null;
  }
}

/** True when the shared socket exists and is currently connected. */
export function isSocketConnected(): boolean {
  return !!socket?.connected;
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
