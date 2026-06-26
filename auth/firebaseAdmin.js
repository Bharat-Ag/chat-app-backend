import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the service account key and initialize firebase-admin.
// If the key is missing/invalid we don't crash the server — push just stays
// disabled and everything else (socket realtime, etc.) keeps working.
let messaging = null;
try {
    const serviceAccount = JSON.parse(
        readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
    );
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    messaging = admin.messaging();
    console.log("firebase-admin initialized — push notifications enabled");
} catch (err) {
    console.warn(
        "firebase-admin not initialized — push notifications disabled:",
        err.message
    );
}

export { messaging };
export default admin;
