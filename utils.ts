import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const authState = {
  user: null,
  profile: null,
  isGuest: false
};

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    await initUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
}

export async function loginAsGuest() {
  try {
    const result = await signInAnonymously(auth);
    authState.isGuest = true;
    
    // Create temporary guest profile
    authState.profile = {
      uid: result.user.uid,
      username: "Guest_" + Math.floor(Math.random() * 10000),
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      rankPoints: 0,
      createdAt: Date.now()
    };
    
    return result.user;
  } catch (error) {
    console.error("Guest Login Error:", error);
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
  authState.user = null;
  authState.profile = null;
  authState.isGuest = false;
}

export async function initUserProfile(user) {
  if (!user) return;
  authState.user = user;
  
  if (authState.isGuest) return; // Guests don't get a Firestore profile

  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // Create new profile
      const newProfile = {
        uid: user.uid,
        username: user.displayName || "Player_" + Math.floor(Math.random() * 10000),
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        rankPoints: 0,
        createdAt: Date.now()
      };
      await setDoc(userRef, newProfile);
      authState.profile = newProfile;
    } else {
      authState.profile = snap.data();
    }
  } catch(error) {
    console.error("User profile initialization failed:", error);
  }
}

export function listenAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!authState.isGuest) {
        await initUserProfile(user);
      }
    } else {
      authState.user = null;
      authState.profile = null;
      authState.isGuest = false;
    }
    callback(user, authState.profile);
  });
}

// Ensure error handling constraint from skill
const OperationType = {
    CREATE: 'create', UPDATE: 'update', DELETE: 'delete', LIST: 'list', GET: 'get', WRITE: 'write'
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
}
