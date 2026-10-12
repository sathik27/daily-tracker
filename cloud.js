```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsYzlcyDeAHfilLSBvzeH_EKGT0sxGsuw",
  authDomain: "yawm-615aa.firebaseapp.com",
  projectId: "yawm-615aa",
  storageBucket: "yawm-615aa.firebasestorage.app",
  messagingSenderId: "265477180140",
  appId: "1:265477180140:web:eee8ed079ca89e87ff33c9",
  measurementId: "G-TV2M6EY3CT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const el = id => document.getElementById(id);
let user = null, timer = null;

const ref = () => doc(db, "users", user.uid);
const status = t => {
  el("syncStatus").textContent = t;
};

function draw() {
  el("signIn").classList.toggle("hidden", !!user);
  el("signOut").classList.toggle("hidden", !user);
  el("acct").textContent = user
    ? "Signed in as " + user.email
    : "Not signed in. Data is only on this device.";

  if (!user) status("");
}

async function push() {
  if (!user) return;

  const ts = Date.now();

  try {
    await setDoc(ref(), {
      payload: JSON.stringify(window.yawmGet()),
      updatedAt: ts
    });

    localStorage.setItem("yawmUpdated", ts);
    localStorage.setItem("yawmSynced", user.uid);
    status("Saved to cloud ✓ " + new Date().toLocaleTimeString());
  } catch (e) {
    status("Offline or blocked. Will retry on next save.");
  }
}

async function pull() {
  if (!user) return;

  try {
    const snap = await getDoc(ref());

    if (!snap.exists()) {
      await push();
      return;
    }

    const c = snap.data();
    const cloud = JSON.parse(c.payload);
    const cts = c.updatedAt || 0;
    const localTs = +localStorage.getItem("yawmUpdated") || 0;

    if (localStorage.getItem("yawmSynced") !== user.uid) {
      window.yawmSet(window.yawmMerge(cloud, window.yawmGet()));
      await push();
    } else if (cts > localTs) {
      window.yawmSet(cloud, cts);
      status("Loaded from cloud ✓");
    } else if (localTs > cts) {
      await push();
    } else {
      status("Saved to cloud ✓");
    }
  } catch (e) {
    status("Could not reach the cloud. Using this device's data.");
  }
}

window.yawmCloudPush = () => {
  if (!user) return;

  clearTimeout(timer);
  status("Saving...");
  timer = setTimeout(push, 1500);
};

onAuthStateChanged(auth, u => {
  user = u;
  draw();

  if (u) {
    status("Syncing...");
    pull();
  }
});

el("signIn").onclick = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    toast(
      e.code === "auth/unauthorized-domain"
        ? "Add this website in Firebase > Authorized domains"
        : "Sign-in failed: " + (e.code || e.message)
    );
  }
};

el("signOut").onclick = async () => {
  if (!confirm(
    "Sign out? Your data stays saved in your Google account. This device's copy will be cleared."
  )) return;

  await push();

  try {
    ["habitData", "yawmUpdated", "yawmSynced", "yawmTimer"]
      .forEach(k => localStorage.removeItem(k));
  } catch (e) {}

  await signOut(auth);
  location.reload();
};

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") pull();
});
```
