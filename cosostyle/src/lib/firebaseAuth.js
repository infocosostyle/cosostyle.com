/**
 * firebaseAuth.js
 * Centralized Firebase Authentication helpers for CosoStyle.
 * All auth operations go through this module.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

/**
 * Sign in with email and password.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function firebaseLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Register a new user with email, password, and display name.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function firebaseRegister(email, password, name) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name immediately after registration
  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential;
}

/**
 * Sign in with Google via popup.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function firebaseGoogleLogin() {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Send a password reset email via Firebase.
 * Firebase handles the reset link — no recovery code needed.
 * @returns {Promise<void>}
 */
export async function firebaseForgotPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
export async function firebaseLogout() {
  return signOut(auth);
}

/**
 * Map a Firebase User object to the app's user shape.
 * This keeps the rest of the app agnostic from Firebase internals.
 * @param {import("firebase/auth").User} firebaseUser
 */
export function mapFirebaseUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL || null,
    emailVerified: firebaseUser.emailVerified,
    // Preserve compatibility with existing app shape
    role: "user",
    loyaltyPoints: 0,
    referralCode: "",
    addresses: [],
  };
}
