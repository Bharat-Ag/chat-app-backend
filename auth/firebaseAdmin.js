import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let messaging = null;
try {
    let serviceAccount;
    if (process.env.NODE_ENV === "production") {
       serviceAccount = JSON.parse( process.env.FIREBASE_SERVICE_ACCOUNT );
    } else {
        serviceAccount = JSON.parse(
            readFileSync(
                join(__dirname, "serviceAccountKey.json"),
                "utf-8"
            )
        );
    }
    initializeApp({
        credential: cert(serviceAccount),
    });

    messaging = getMessaging();
    console.log( "firebase-admin initialized — push notifications enabled" );
} catch (err) {
    console.warn(
        "firebase-admin not initialized — push notifications disabled:",
        err.message
    );
}

export { messaging };