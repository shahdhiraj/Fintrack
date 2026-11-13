import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in. */
export function initiateAnonymousSignIn(
  authInstance: Auth,
  onError?: (error: any) => void
): Promise<UserCredential | void> {
  return signInAnonymously(authInstance).catch((error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('Anonymous sign-in error:', error);
    }
  });
}

/** Initiate email/password sign-up. */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string,
  onError?: (error: any) => void
): Promise<UserCredential | void> {
  return createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('Sign-up error:', error);
    }
  });
}

/** Initiate email/password sign-in. */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string,
  onError?: (error: any) => void
): Promise<UserCredential | void> {
  return signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('Sign-in error:', error);
    }
  });
}
