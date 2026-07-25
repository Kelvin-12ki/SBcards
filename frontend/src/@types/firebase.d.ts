declare module 'firebase/app' {
  import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';
  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
  export type { FirebaseApp, FirebaseOptions };
}

declare module 'firebase/auth' {
  import {
    Auth,
    UserCredential,
    User,
    AuthProvider,
  } from '@firebase/auth-types';
  export function getAuth(app?: any): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): () => void;
  export function getIdToken(user: User, forceRefresh?: boolean): Promise<string>;
  export type { Auth, User, UserCredential };
}

declare module 'firebase/storage' {
  export interface FirebaseStorage {}
  export interface StorageReference {}
  export interface UploadResult {
    ref: StorageReference;
    metadata: any;
  }
  export function getStorage(app?: any): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path: string): StorageReference;
  export function uploadBytes(storageRef: StorageReference, data: Blob | Uint8Array | ArrayBuffer): Promise<UploadResult>;
  export function getDownloadURL(storageRef: StorageReference): Promise<string>;
}
