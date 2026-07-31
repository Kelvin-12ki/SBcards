import toast from 'react-hot-toast';

// Backend messages that are already user-friendly and should pass through
const PASSTHROUGH_PATTERNS = [
  /already/i,
  /required/i,
  /must be/i,
  /cannot/i,
  /not found/i,
  /invalid/i,
  /limit/i,
  /expired/i,
];

function isPassthroughMessage(msg: string): boolean {
  return PASSTHROUGH_PATTERNS.some(p => p.test(msg));
}

// Status code → friendly message mapping
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Something went wrong with your request. Please check and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you're looking for.",
  409: 'This action conflicts with existing data.',
  422: 'Please check your input and try again.',
  429: "You're doing that too much. Please wait a moment and try again.",
  500: 'Something went wrong on our end. Please try again in a moment.',
  502: 'Our service is temporarily unavailable. Please try again shortly.',
  503: 'Our service is temporarily unavailable. Please try again shortly.',
  504: 'Our service is taking too long to respond. Please try again.',
};

export function getFriendlyErrorMessage(error: unknown, fallback?: string): string {
  // Offline check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  if (!error || typeof error !== 'object') {
    return fallback || 'Something unexpected happened. Please try again.';
  }

  const err = error as any;

  // Timeout
  if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
    return 'The request took too long. Please try again.';
  }

  // HTTP error with response
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    // Extract message from backend response
    let backendMsg = '';
    if (data?.message) {
      backendMsg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
    }

    // If backend message is user-friendly, pass it through
    if (backendMsg && isPassthroughMessage(backendMsg)) {
      // Capitalize first letter
      return backendMsg.charAt(0).toUpperCase() + backendMsg.slice(1);
    }

    // For validation errors (array), join them
    if (data?.message && Array.isArray(data.message)) {
      const joined = data.message.join('; ');
      return `Please check your input: ${joined}`;
    }

    // Use status-code-based friendly message
    if (STATUS_MESSAGES[status]) {
      return STATUS_MESSAGES[status];
    }

    return fallback || 'Something unexpected happened. Please try again.';
  }

  // Request made but no response (network error)
  if (err.request) {
    return 'Unable to connect to our servers. Please check your internet connection and try again.';
  }

  // Other error with a message
  if (err.message) {
    const msg = String(err.message);
    // Don't show raw technical messages
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    // If it looks like a user-friendly message already
    if (msg.length < 100 && !msg.includes('Error:') && !msg.includes('at ')) {
      return msg;
    }
  }

  return fallback || 'Something unexpected happened. Please try again.';
}

export function showApiError(error: unknown, fallbackMessage?: string): void {
  const message = getFriendlyErrorMessage(error, fallbackMessage);
  toast.error(message, { duration: 4000 });
  // Log raw error for debugging
  console.error('[API Error]', error);
}
