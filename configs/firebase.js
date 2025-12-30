import admin from "firebase-admin";
import serviceAccount from "../split-expense-application-firebase-adminsdk-fbsvc-a940ff35bf.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
