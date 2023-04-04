import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
//import verificationEmail from "../../email-templates/verification.email";
//import * as email from "../controllers/email";

//const { boom } = functions.config();

/**
 * Send emails to new users on sign-up
 */
export const sendVerificationEmail = functions.auth
  .user()
  .onCreate(async (user) => {
    try {
      // const actionCodeSettings = {
      //   // URL you want to redirect back to. The domain (www.example.com) for
      //   // this URL must be whitelisted in the Firebase Console.
      //   url: `${boom.web_url}`,
      //   // This must be true for email link sign-in.
      //   handleCodeInApp: true
      // };
      // const link = await admin
      //   .auth()
      //   .generateEmailVerificationLink(user.email!, actionCodeSettings);
      //console.log("Generated verification link:", link);
      // const mailHtml = verificationEmail.replace(/%LINK%/g, link);
      // const mailOptions = {
      //   from: "Boom Rewards <noreply@boomcarding.com>",
      //   to: user.email,
      //   subject: "Please confirm your email for Boom Rewards",
      //   html: mailHtml
      // };
      // console.log(
      //   `Sending verification email to ${user.email} for user ${user.uid}`
      // );
      //await email.send(mailOptions)
      // console.log(
      //   `Successfully sent verification email to ${user.email} for user ${user.uid}!`
      // );
    } catch (err) {
      console.error(err.toString());
    }
  });

/**
 * Update roles when profile is modified
 */
export const profile = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    try {
      const oldDoc = change.before.exists
        ? change.before.data()
        : { roles: [] };
      /*const oldDoc = change.before.exists // Enable this once we update node
        ? change.before.data() ?? { roles: [] }
        : { roles: [] };*/
      // If the document does not exist, it has been deleted.
      const newDoc = change.after.exists ? change.after.data() : null;

      if (newDoc) {
        if (newDoc.roles) {
          if (oldDoc!.roles.join(",") !== newDoc.roles.join(",")) {
            console.log(
              `Profile document found for uid: ${context.params.userId}. Will set roles:`,
              newDoc.roles
            );
            //Some validation could be done here in case the values are directly modified in Console and none existing roles are added
            await admin.auth().setCustomUserClaims(context.params.userId, {
              roles: newDoc.roles,
            });
            if (newDoc.roles.includes("merchant")) {
              // we need to check if we need to call this for other roles, member has an update on line 83 so probably that is ausing only merchant to have the issue with clains
              // when we create a new merchant, the roles get updated serverside we need to let the frontend there's an update so it refresh the token,
              // that's why I change a custom value(forceUpdate boolean) so the function listenForProfileChange on web\redux\sagas\auth.ts is called
              // this one refreshes the token
              const db: admin.firestore.Firestore = admin.firestore();
              await db.doc(`users/${context.params.userId}`).update({
                forceUpdate: !newDoc.forceUpdate, // we always change this value when roles change
              });
              console.log("Force update on merchant");
            }
          }
          if (newDoc.roles.includes("member")) {
            const db: admin.firestore.Firestore = admin.firestore();
            await db.doc(`users/${context.params.userId}`).update({
              hasCards: newDoc.cards ? newDoc.cards.length > 0 : false,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in the profile onWrite trigger:", error);
    }
  });

/**
 * Delete profile if associated auth user is deleted
 */
export const deleteUserProfile = functions.auth
  .user()
  .onDelete(async (user) => {
    try {
      const ref = admin.firestore().doc(`users/${user.uid}`);
      await ref.delete();
    } catch (error) {
      console.error("Error deleting user profile:", error);
    }
  });
