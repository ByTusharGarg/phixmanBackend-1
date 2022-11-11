const sdk = require("api")("@cashfreedocs-new/v2#1224ti1hl4o0uyhs");
const axios = require("axios").default;

let casrfreeUrlLinks =
    process.env.CASH_FREE_MODE === "Test"
        ? process.env.CASHFREE_GATEWAY_DEV_URL
        : process.env.CASHFREE_GATEWAY_PROD_URL;
sdk.server(casrfreeUrlLinks);

class Payouts {
    constructor() {
        this.APPID = process.env.CASHFREE_APP_ID;
        this.APPSECRET = process.env.CASHFREE_APP_SECRET;
        this.ENV = process.env.CASH_FREE_MODE;
        this.casrfreeUrl = casrfreeUrlLinks;
    }


}

module.exports = new Payouts();
