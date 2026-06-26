import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let messaging = null;
try {
    let serviceAccount;
    if (process.env.NODE_ENV === "production") {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = JSON.parse(
            readFileSync(join(__dirname, "serviceAccountKey.json"),"utf-8")
        );
    }
    admin.initializeApp({credential: admin.credential.cert(serviceAccount),});
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