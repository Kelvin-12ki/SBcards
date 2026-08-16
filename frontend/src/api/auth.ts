import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/utils/firebase';
import apiClient from './client';
import type { User } from '@/types/user';

interface AuthResponse {
  accessToken: string;
  user: User;
}

/** Ensure Firebase auth is initialized and log state */
function requireAuth() {
  console.log('[Auth] Firebase auth object:', auth ? 'initialized' : 'NULL');
  if (!auth) {
    console.error('[Auth] Firebase auth is null — Firebase may not be initialized');
    throw new Error(
      'Firebase is not configured. Please check your environment settings.',
    );
  }
  return auth;
}

/** Map Firebase error codes to friendly messages */
export function getFirebaseAuthErrorMessage(err: any): string {
  const code = err?.code || '';
  console.error('[Auth] Firebase error:', code, err?.message);

  const messages: Record<string, string> = {
    'auth/invalid-credential':
      'Incorrect email or password. If you signed up with Google, use "Continue with Google" instead.',
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

  console.log('[Auth] Attempting signInWithEmailAndPassword for:', email);
  const userCredential: UserCredential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  console.log('[Auth] Firebase sign-in successful, getting ID token...');

  const idToken = await userCredential.user.getIdToken();
  console.log('[Auth] ID token obtained, calling backend /auth/verify...');

  try {
    const { data } = await apiClient.post<AuthResponse>('/auth/verify', {
      idToken,
    });
    console.log('[Auth] Backend verify successful');

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (backendErr: any) {
    console.error('[Auth] Backend verify failed:', backendErr?.response?.data || backendErr?.message);
    throw new Error(
      backendErr?.response?.data?.message ||
      'Account created but server verification failed. Please try signing in again.',
    );
  }
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

  console.log('[Auth] Attempting createUserWithEmailAndPassword for:', email);
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password,
    );
    console.log('[Auth] Firebase user created successfully');

    // Set the display name on the Firebase profile
    if (displayName) {
      console.log('[Auth] Setting displayName:', displayName);
      await updateProfile(userCredential.user, { displayName });
    }

    // Send verification email (non-blocking)
    sendEmailVerification(userCredential.user, {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    }).catch((e) => console.warn('[Auth] Verification email failed:', e));
  } catch (err: any) {
    console.error('[Auth] createUserWithEmailAndPassword failed:', err?.code, err?.message);
    throw new Error(getFirebaseAuthErrorMessage(err));
  }

  // After creation, log in to get the backend token
  console.log('[Auth] User created, now signing in...');
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

  console.log('[Auth] Attempting Google sign-in...');
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(firebaseAuth, provider);
  console.log('[Auth] Google sign-in successful, getting ID token...');

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
 * Check if the current Firebase user has an email/password credential.
 * Returns false for Google-only accounts.
 */
export async function hasPasswordProvider(): Promise<boolean> {
  const firebaseAuth = requireAuth();
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser) return false;
  await fbUser.reload();
  // Firebase providerData includes 'password' if user signed up with email/password
  return fbUser.providerData.some((p) => p.providerId === 'password');
}

/**
 * Set a password on an existing account (e.g. Google-only user wanting email/password login).
 * Uses linkWithCredential to add email/password auth to a Google-only account.
 */
export async function setPasswordForGoogleUser(password: string): Promise<void> {
  const firebaseAuth = requireAuth();
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser || !fbUser.email) throw new Error('No authenticated user');

  console.log('[Auth] Setting password for Google user:', fbUser.email);

  try {
    // Try updatePassword first (works if user already has a password provider)
    await updatePassword(fbUser, password);
    console.log('[Auth] Password updated successfully via updatePassword');
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      // For Google-only users, we need to link email/password credential
      console.log('[Auth] requires-recent-login, trying linkWithCredential...');
      const credential = EmailAuthProvider.credential(fbUser.email, password);
      await linkWithCredential(fbUser, credential);
      console.log('[Auth] Email/password credential linked successfully');
    } else {
      throw err;
    }
  }
}

/**
 * Change password for users who already have email/password.
 * Requires re-authentication first.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const firebaseAuth = requireAuth();
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser || !fbUser.email) throw new Error('No authenticated user');

  console.log('[Auth] Changing password for:', fbUser.email);

  // Re-authenticate with current password first
  const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
  await reauthenticateWithCredential(fbUser, credential);

  // Now update to new password
  await updatePassword(fbUser, newPassword);
  console.log('[Auth] Password changed successfully');
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
