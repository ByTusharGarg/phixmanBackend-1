const sdk = require('api')('@cashfreedocs-new/v2#3ydphnjkycu3dpv');
const axios = require("axios").default;
const partnerBankDetailsModel = require('../../models/partnerbankDetails');

let casrfreeUrlLinks =
    process.env.CASH_FREE_MODE === "Test"
        ? process.env.CASHFREE_PAYOUT_DEV_URL
        : process.env.CASHFREE_PAYOUT_PROD_URL;


class Payouts {
    constructor() {
        this.APPID = process.env.PAYOUT_CLIENT_KEY;
        this.APPSECRET = process.env.PAYOUT_CLIENT_SECRET;
        this.ENV = process.env.CASH_FREE_MODE;
    }

    async genrateAuthorizationTokenCashfree() {
        const options = {
            method: 'POST',
            url: `${casrfreeUrlLinks}/v1/authorize`,
            headers: { accept: 'application/json', 'X-Client-Secret': this.APPSECRET, 'X-Client-Id': this.APPID }
        };
        return axios.request(options)
    }

    async createBeneficiaryToCashhfree(body) {
        try {
            const { data: { data: { token } } } = await this.genrateAuthorizationTokenCashfree();
            if (!token) {
                throw new Error("token required");
            }
            // const body = {
            //     beneId: 'kihud',
            //     name: 'oijiijiju',
            //     email: 'tarun@gmail.com',
            //     phone: '8510967008',
            //     bankAccount: '00111122233',
            //     ifsc: 'HDFC0000001',
            //     address1: 'ABC Street'
            // };
            const options = {
                method: 'POST',
                url: `${casrfreeUrlLinks}/v1/addBeneficiary`,
                data: body,
                headers: { accept: 'application/json', 'authorization': `Bearer ${token}` }
            };
            return axios.request(options)
        } catch (error) {
            throw new Error(error);
        }
    }

    async updateBeneficiaryToCashfree(befId, data) {
        try {
            const { data: { data: { token } } } = await this.genrateAuthorizationTokenCashfree();
            if (!token) {
                throw new Error("token required");
            }

            try {
                const options = {
                    method: 'POST',
                    url: `${casrfreeUrlLinks}/v1/removeBeneficiary`,
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                        'content-type': 'application/json'
                    },
                    data: { beneId: befId }
                };

                await axios.request(options)
                await this.createBeneficiaryToCashhfree(data);

            } catch (error) {
                throw new Error(error);
            }

        } catch (error) {
            throw new Error(error);
        }
    }

    async verifyBankAccountCashfree(bankAccount, ifsc) {
        const { data: { data: { token } } } = await this.genrateAuthorizationTokenCashfree();
        if (!token) {
            throw new Error("token required");
        }
        const options = {
            method: 'GET',
            url: `${casrfreeUrlLinks}/v1.2/validation/bankDetails?bankAccount=${bankAccount}&ifsc=${ifsc}`,
            headers: { accept: 'application/json', Authorization: `Bearer ${token}` }
        };
        return axios.request(options)
    }

    async createUpdateAccountDetails(id, data) {
        return partnerBankDetailsModel.findOneAndUpdate({ partnerId: id }, data, { new: true, upsert: true })
    }


}

module.exports = new Payouts();
