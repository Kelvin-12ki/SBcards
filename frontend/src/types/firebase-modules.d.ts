/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'firebase/app' {
  const firebase: any;
  export default firebase;
  export const initializeApp: any;
}

declare module 'firebase/auth' {
  export const getAuth: any;
  export const signInWithEmailAndPassword: any;
  export const createUserWithEmailAndPassword: any;
  export const updateProfile: any;
  export const signOut: any;
  export const onAuthStateChanged: any;
  export const getIdToken: any;
}

declare module 'firebase/storage' {
  export const getStorage: any;
  export const ref: any;
  export const uploadBytes: any;
  export const getDownloadURL: any;
}
