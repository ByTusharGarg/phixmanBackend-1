const admin = require("firebase-admin");
const phixmanpartnerServiceAccount = require(`../../keysjson/phixmancustomerapp-firebase-adminsdk-5h9om-2cf651c6d9.json`);

class partnerPopNotification {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(phixmanpartnerServiceAccount)
        });
    }

    sendToCustomerPopUpNotiFication(deviceToken, payload) {
        let options = {
            priority: "high",
            timeToLive: 60 * 60 * 24
        }

        admin.messaging().sendToDevice(deviceToken, payload, options);
    }
}




module.exports = new partnerPopNotification();