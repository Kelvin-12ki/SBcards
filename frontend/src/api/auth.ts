import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/utils/firebase';
import apiClient from './client';
import type { User } from '@/types/user';

interface AuthResponse {
  accessToken: string;
  user: User;
}

/** Ensure Firebase auth is initialized */
function requireAuth() {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Please check your environment settings.',
    );
  }
  return auth;
}

/** Map Firebase error codes to friendly messages */
export function getFirebaseAuthErrorMessage(err: any): string {
  const code = err?.code || '';

  const messages: Record<string, string> = {
    'auth/invalid-credential':
      'Incorrect email or password. Please try again.',
    'auth/user-not-found':
      'No account found with this email. Please register first.',
    'auth/wrong-password':
      'Incorrect password. Please try again.',
    'auth/email-already-in-use':
      'An account with this email already exists. Please sign in instead.',
    'auth/weak-password':
      'Password must be at least 6 characters.',
    'auth/invalid-email':
      'Please enter a valid email address.',
    'auth/too-many-requests':
      'Too many failed attempts. Please wait a few minutes before trying again.',
    'auth/user-disabled':
      'This account has been disabled. Please contact support.',
    'auth/network-request-failed':
      'Network error. Please check your connection and try again.',
    'auth/operation-not-allowed':
      'Email/password sign-up is not enabled. Please use Google sign-in or contact support.',
    'auth/popup-closed-by-user':
      'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':
      'Pop-up was blocked by your browser. Please allow pop-ups for this site.',
    'auth/cancelled-popup-request':
      'Sign-in was cancelled. Please try again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method. Try signing in with Google.',
    'auth/requires-recent-login':
      'This operation requires a recent login. Please sign in again.',
  };

  return (
    messages[code] ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

/**
 * Log in with email and password using Firebase, then verify with the backend.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const firebaseAuth = requireAuth();

  const userCredential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  const idToken = await userCredential.user.getIdToken();

  const { data } = await apiClient.post<AuthResponse>('/auth/verify', {
    idToken,
  });

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

/**
 * Register a new user with Firebase, then log them in.
 * Sends a verification email after registration.
 */
export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResponse> {
  const firebaseAuth = requireAuth();

  try {
    const userCredential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password,
    );

    // Set the display name on the Firebase profile
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Send verification email (non-blocking)
    sendEmailVerification(userCredential.user, {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    }).catch(() => {});
  } catch (err: any) {
    // Re-throw with a friendly message
    throw new Error(getFirebaseAuthErrorMessage(err));
  }

  // After creation, log in to get the backend token
  return login(email, password);
}

/**
 * Resend verification email to the currently signed-in Firebase user.
 */
export async function resendVerificationEmail(): Promise<void> {
  const firebaseAuth = requireAuth();
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser) throw new Error('No authenticated user');
  await sendEmailVerification(fbUser, {
    url: window.location.origin + '/login',
    handleCodeInApp: true,
  });
}

/**
 * Check if the current Firebase user's email is verified.
 */
export async function isEmailVerified(): Promise<boolean> {
  const firebaseAuth = requireAuth();
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser) return false;
  await fbUser.reload();
  return fbUser.emailVerified;
}

/**
 * Log out: sign out of Firebase and clear local state.
 */
export async function logout(): Promise<void> {
  const firebaseAuth = requireAuth();
  await signOut(firebaseAuth);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

/**
 * Log in with Google account using Firebase popup, then verify with the backend.
 */
export async function loginWithGoogle(): Promise<AuthResponse> {
  const firebaseAuth = requireAuth();

  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(firebaseAuth, provider);
  const idToken = await userCredential.user.getIdToken();

  const { data } = await apiClient.post<AuthResponse>('/auth/verify', {
    idToken,
  });

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

/**
 * Send a password reset email via Firebase.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const firebaseAuth = requireAuth();
  await sendPasswordResetEmail(firebaseAuth, email);
}

/**
 * Fetch the currently authenticated user from the backend.
 * If the role changed, saves the fresh JWT token.
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<{ user: User; accessToken?: string }>(
    '/auth/me',
  );
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    apiClient.defaults.headers.common['Authorization'] =
      `Bearer ${data.accessToken}`;
  }
  return data.user;
}
