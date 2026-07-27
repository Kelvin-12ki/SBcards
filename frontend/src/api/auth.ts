import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth } from '@/utils/firebase';
import apiClient from './client';
import type { User } from '@/types/user';

interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * Log in with email and password using Firebase, then verify with the backend.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
 */
export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Set the display name on the Firebase profile
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (err?.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters.');
    }
    if (err?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    throw err;
  }
  // After creation, log in to get the backend token
  return login(email, password);
}

/**
 * Log out: sign out of Firebase and clear local state.
 */
export async function logout(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

/**
 * Fetch the currently authenticated user from the backend.
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}
