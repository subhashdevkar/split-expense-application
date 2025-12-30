import admin from "../configs/firebase.js";

export const sendPush = async (token, title, body) => {
  try {
    await admin.messaging().send({
      notification: { title, body },
      token,
    });
  } catch (error) {
    console.log("firebase push notification error", error);
  }
};
