const sdk = require('api')('@cashfreedocs-new/v2#3ydphnjkycu3dpv');
const axios = require("axios").default;
const partnerBankDetailsModel = require('../../models/partnerbankDetails');
const payoutModel = require('../../models/payouts.model');
const orderModel = require('../../models/Order');
const partnerModel = require('../../models/Partner');
const { category } = require('../../models');

const { payoutStatusTypesObject } = require('../../enums/types');
const { invoiceTypes } = require('../../enums/invoiceTypes');

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

    async initiateCashfreePayout(beneId, amount, transferId, remark) {
        const { data: { data: { token } } } = await this.genrateAuthorizationTokenCashfree();
        const transferMode = "banktransfer";

        const options = {
            method: 'POST',
            url: `${casrfreeUrlLinks}/v1.2/requestAsyncTransfer`,
            headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
            data: {
                beneId: beneId,
                amount: amount,
                transferId: transferId,
                transferMode: transferMode,
                remarks: remark
            }
        };

        return axios.request(options)
    }

    async initiatePayout(partnerId, orderId, payoutId) {
        let partnerAccountDetails = null;
        let orderDetails = null;
        let payoutData = null;

        try {
            partnerAccountDetails = await partnerBankDetailsModel.findOne({ partnerId: partnerId });

            if (!partnerAccountDetails) {
                throw new Error("partner bank details not found");
            }

            if (!partnerAccountDetails.beneId) {
                throw new Error("please update account details");
            }

            orderDetails = await orderModel.findOne({ Partner: partnerId, _id: orderId });
            if (!orderDetails) {
                throw new Error("no order details found");
            }

            payoutData = await payoutModel.findById(payoutId);
            if (!payoutData) {
                throw new Error("invalid payout or not exists");
            }

            if (payoutData.status !== payoutStatusTypesObject.WITHDRAW && payoutData.status !== payoutStatusTypesObject.FAILED) {
                throw new Error("this payment is not allowed to be initiate");
            }
        } catch (error) {
            throw new Error(error.message || "something is missing");
        }

        try {
            // create payout on cashfree
            const payoutResp = await this.initiateCashfreePayout(partnerAccountDetails.beneId, payoutData.payableAmount, payoutData.transferId, "order payment");
            if (payoutResp.data.status === 'ACCEPTED') {
                // create on our db
                await payoutModel.findByIdAndUpdate(payoutData._id, { metaData: payoutResp.data.data, status: payoutStatusTypesObject.INPROGRESS });
                return orderModel.findByIdAndUpdate(orderDetails._id, { payoutId: payoutData._id });
            }
            throw new Error("Unable to initiate payout");
            // update on order
        } catch (error) {
            throw new Error(error.message || "something went wrong");
        }
    }

    async isPartnerGstExists(partnerId) {
        try {
            const partner = await partnerModel.findById(partnerId);
            if (partner['gstCertificateNo']) {
                return partner;
            }
            return false;
        } catch (error) {

        }
    }

    howMuchCanDeduct(currentAmount, toBeTaken) {
        const fiftyPercentageOfPayable = (currentAmount * (50 / 100));
        if (fiftyPercentageOfPayable < toBeTaken) {
            return fiftyPercentageOfPayable;
        }
        return toBeTaken;
    }

    async createPayoutOnDbOnline(data, categoryId) {
        const { orderId, totalAmount, codAmount } = data;
        let totalDeduction = 0;
        let deduction = [];
        let status = payoutStatusTypesObject.WITHDRAW;

        // ----- deduction cases -----

        // gst deduction
        const partnerDataRe = await this.isPartnerGstExists(data.partnerId)
        if (!partnerDataRe) {
            let amt = (totalAmount * (18 / 100));
            totalDeduction += amt;
            deduction.push({ title: "Tax collection (Without GST)", value: amt, desc: "Tax deduction" })
        } else {
            deduction.push({ title: "Tax collection (Without GST)", value: 0, desc: "Tax deduction" })
        }

        // per category commission
        const categoryData = await category.findById(categoryId);
        let companyComissionPercentage = parseInt(categoryData.companyComissionPercentage);

        if (companyComissionPercentage) {
            let amt = (totalAmount * (companyComissionPercentage / 100));
            totalDeduction += amt;
            deduction.push({ title: "Phixmen Commision", value: amt, desc: "Phixmen Commision" })
        } else {
            throw new Error("no commission found");
        }

        if (codAmount !== 0) {
            deduction.push({ title: "Partner Cash payment amount", value: codAmount, desc: "Cash payment" });
        }

        const transferId = `PAY_${Math.floor(Date.now() * Math.random() * 10)}`;
        let payableAmount = (totalAmount - (totalDeduction + codAmount));

        if (payableAmount < 0) {
            payableAmount = (totalAmount - codAmount);
            deduction.push({ title: "This fees will be deducted in next order", value: totalDeduction, desc: "over due" });
            await partnerModel.findByIdAndUpdate(data.partnerId, { $inc: { codCollection: totalDeduction } });
        }

        // deduct some amount if any previous exists we can in current order
        const leftAmount = partnerDataRe.codCollection;
        if (leftAmount > 0) {
            let howMuchDeduct = howMuchCanDeduct(payableAmount, leftAmount);
            if (howMuchDeduct) {
                payableAmount -= howMuchDeduct;
                deduction.push({ title: "This fees is deducted againts your previous order", value: howMuchDeduct, desc: "deduction" });
                await partnerModel.findByIdAndUpdate(data.partnerId, { $inc: { codCollection: -howMuchDeduct } });
            }
        }

        try {
            const isExist = await payoutModel.findOne({ orderId });
            if (isExist) {
                throw new Error("allready initialized or completed");
            }

            const newwithDraw = new payoutModel({ ...data, transferId, logs: [{ status: payoutStatusTypesObject.WITHDRAW, timestampLog: new Date() }], totalDeduction, payableAmount, deduction, status });
            const rep = await newwithDraw.save();
            return rep;
        } catch (error) {
            throw new Error(error.message || "something went wrong");
        }
    }

    async createClaimPayoutOnDbOnline(claimId, data) {
        const { totalAmount } = data;
        const transferId = `PAY_${Math.floor(Date.now() * Math.random() * 100)}`;

        try {
            const isExist = await payoutModel.findOne({ claimId });
            if (isExist) {
                throw new Error("allready initialized or completed");
            }
            const newwithDraw = new payoutModel({ totalAmount, totalDeduction: 0, claimId, payableAmount: totalAmount, paymentMode: "online", transferId, logs: [{ status: payoutStatusTypesObject.WITHDRAW, timestampLog: new Date() }] });
            return newwithDraw.save();
        } catch (error) {
            throw new Error(error.message || "something went wrong");
        }
    }

    async createPayoutOnDbCod(data, categoryId) {
        const { orderId, totalAmount, codAmount } = data;
        let totalDeduction = 0;
        let deduction = [];
        let status = payoutStatusTypesObject.WITHDRAW;

        // ----- deduction cases -----

        // gst deduction
        if (!this.isPartnerGstExists(data.partnerId)) {
            let amt = (totalAmount * (18 / 100));
            totalDeduction += amt;
            deduction.push({ title: "Tax collection (Without GST)", value: amt, desc: "Tax deduction" })
        } else {
            deduction.push({ title: "Tax collection (Without GST)", value: 0, desc: "Tax deduction" })
        }

        // cod order ammount
        if (data['paymentMode'] === 'cod') {
            let amt = (totalAmount * (2 / 100));
            totalDeduction += amt;
            deduction.push({ title: "Cash payment/ self 2% Deduction", value: amt, desc: "Cash payment" })
        }

        // per category commission
        const categoryData = await category.findById(categoryId);
        let companyComissionPercentage = parseInt(categoryData.companyComissionPercentage);

        if (companyComissionPercentage) {
            let amt = (totalAmount * (companyComissionPercentage / 100));
            totalDeduction += amt;
            deduction.push({ title: "Phixmen Commision", value: amt, desc: "Phixmen Commision" })
        } else {
            throw new Error("no commission found");
        }

        let payableAmount = 0;
        const transferId = `PAY_${Math.floor(Date.now() * Math.random() * 10)}`;

        if (codAmount === 0) {
            payableAmount = (totalAmount - totalDeduction);
        } else {
            payableAmount = 0;
            status = payoutStatusTypesObject.NOT_ALLOWED;
            deduction.push({ title: "Partner Cash payment amount", value: codAmount, desc: "Cash payment" });
            deduction.push({ title: "This fees will be deducted in next order", value: totalDeduction, desc: "over due" });
            await partnerModel.findByIdAndUpdate(data.partnerId, { $inc: { codCollection: totalDeduction } });
        }

        try {
            const isExist = await payoutModel.findOne({ orderId });
            if (isExist) {
                throw new Error("allready initialized or completed");
            }
            const newwithDraw = new payoutModel({ ...data, transferId, logs: [{ status: payoutStatusTypesObject.WITHDRAW, timestampLog: new Date() }], totalDeduction, payableAmount, deduction, status });
            const rep = await newwithDraw.save();
            return rep;
        } catch (error) {
            throw new Error(error.message || "something went wrong");
        }
    }

    async myWithdrawals(partnerId) {
        return payoutModel.find({ partnerId });
    }

    async findPayoutsList(query) {
        return payoutModel.find(query).populate("partnerId", "Sno Name");
    }
}

module.exports = new Payouts();
