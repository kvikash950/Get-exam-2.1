'use client';
import {
  Auth,
  User,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth, onError?: (error: any) => void): void {
  signInAnonymously(authInstance).catch(error => {
    console.error("Anonymous sign-in error:", error);
    if (onError) onError(error);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onError?: (error: any) => void): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(error => {
    console.error("Email sign-up error:", error);
    if (onError) onError(error);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onError?: (error: any) => void): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(error => {
    console.error("Email sign-in error:", error);
    if (onError) onError(error);
  });
}

/** Send native Firebase email verification link. */
export function sendVerificationEmail(user: User, onError?: (error: any) => void): void {
  sendEmailVerification(user).catch(error => {
    console.error("Verification email send error:", error);
    if (onError) onError(error);
  });
}
