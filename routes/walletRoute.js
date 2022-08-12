const router = require("express").Router();
const { transsactionTypes, transsactionStatus } = require('../enums/types');
const { WalletTransaction, Wallet, Partner, CustomerWallet, Customer } = require("../models")
const { body } = require("express-validator");
const { rejectBadRequests } = require('../middleware');
const checkPartner = require('../middleware/AuthPartner');
const checkCustomer = require('../middleware/AuthCustomer');

const validateWallletBodyValidator = [
    body("amount")
        .notEmpty()
        .withMessage("amount cannot be empty")
        .not().isString()
        .withMessage("invalid type of amount")
];

const validateCustomerWallletBodyValidator = [
    body("amount")
        .notEmpty()
        .withMessage("amount cannot be empty")
        .not().isString()
        .withMessage("invalid type of amount")
];

const validateUserWallet = async (id) => {
    try {
        // check if user have a wallet, else create wallet
        let userWallet = null;
        userWallet = await Wallet.findOne({ partnerId: id });
        // If user wallet doesn't exist
        if (!userWallet) {
            userWallet = await Wallet.create({ partnerId: id })
        }
        return userWallet;
    } catch (error) {
        throw new Error("Something went wrong")
    }
};


const validateCustomerWallet = async (id) => {
    try {
        // check if user have a wallet, else create wallet
        let userWallet = null;
        userWallet = await CustomerWallet.findOne({ customerId: id });
        // If user wallet doesn't exist
        if (!userWallet) {
            userWallet = await CustomerWallet.create({ customerId: id })
        }
        return userWallet;
    } catch (error) {
        throw new Error("Something went wrong")
    }
};


const getWallletTranssaction = async (id, type) => {
    if (type !== "partner" && type !== "customer") {
        throw new Error("Invalid transsactionUser")
    }

    try {
        // check if user have a wallet, else create wallet
        let data = null;
        if (type === "partner") {
            data = await WalletTransaction.find({ partnerId: id, transsactionUser: "partner" }).sort({ createdAt: -1 });
        } else {
            data = await WalletTransaction.find({ customerId: id, transsactionUser: "customer" }).sort({ createdAt: -1 });
        }
        return data;
    } catch (error) {
        throw new Error("Something went wrong")
    }
};



const createWalletTransaction = async (userId, transsactionUser, walletId, amount, title, transsactionType, status, reason) => {
    if (!transsactionTypes.includes(transsactionType)) {
        throw new Error('Invalid transsactionType')
    }
    if (!transsactionStatus.includes(status)) {
        throw new Error('Invalid status')
    }

    if (!userId) {
        throw new Error('userId required')
    }

    try {
        // create wallet transaction
        const walletTransaction = new WalletTransaction({
            amount,
            partnerId: transsactionUser === "partner" ? userId : null,
            customerId: transsactionUser === "customer" ? userId : null,
            transsactionUser: transsactionUser,
            walletId,
            title,
            transsactionType,
            status,
            reason
        });
        return walletTransaction.save();
    } catch (error) {
        throw new Error('Error accure')
    }
};


const updatePartnerWallet = async (partnerId, amount, transsactionType, currentWallet) => {
    let finalAmount = 0;

    if (transsactionType === 'credit') {
        finalAmount = amount;
    } else {
        if (currentWallet.balance - amount < 0) {
            throw new Error('insufficient wallet balance')
        }
        finalAmount = -amount
    }

    try {
        // update wallet
        const wallet = await Wallet.findOneAndUpdate(
            { partnerId },
            { $inc: { balance: finalAmount } },
            { new: true }
        );
        return wallet;
    } catch (error) {
        throw new Error('Error accure unable to make transaction')
    }
};

const updateCustomerWallet = async (customerId, amount, transsactionType, currentWallet) => {
    let finalAmount = 0;

    if (transsactionType === 'credit') {
        finalAmount = amount;
    } else {
        if (currentWallet.balance - amount < 0) {
            throw new Error('insufficient wallet balance')
        }
        finalAmount = -amount
    }

    try {
        // update wallet
        const wallet = await CustomerWallet.findOneAndUpdate(
            { customerId },
            { $inc: { balance: finalAmount } },
            { new: true }
        );
        return wallet;
    } catch (error) {
        throw new Error('Error accure unable to make transaction')
    }
};


const makePartnerTranssaction = async (userType, status, partnerId, amount, title, transsactionType) => {
    let walletId;

    if (!status || status === "") {
        status = "successful";
    }

    if (amount < 1) {
        throw new Error("should be grater then 0")
    }

    try {
        // check is Partner exist in our database
        const partnerExists = await Partner.findById(partnerId);
        if (!partnerExists) {
            // return res
            //     .status(404)
            //     .json({ message: "" });
            throw new Error("partner not found");
        }

        // check if user have a wallet, else return
        const wallet = await validateUserWallet(partnerExists._id);

        if (!wallet) {
            // return res
            //     .status(404)
            //     .json({ message: "Wallet not found" });
            throw new Error("Wallet not found");
        }

        walletId = wallet._id;

        const resp = await updatePartnerWallet(partnerId, amount, transsactionType, wallet);
        // create wallet transaction

        if (resp) {
            await createWalletTransaction(partnerId, userType, walletId, amount, title, transsactionType, status, "transaction successfull");
            // return res.status(200).json({
            //     response: "wallet funded successfully",
            //     data: resp,
            // });
            return resp;
        }
    } catch (error) {
        throw new Error(error.message ? error.message : "Error encountered.");
        // return res.status(500).json({ message: error.message ? error.message : "Error encountered." });
    }
}

const makeCustomerTranssaction = async (userType, status, customerId, amount, title, transsactionType) => {
    let walletId;

    if (!status || status === "") {
        status = "successful";
    }

    if (amount < 1) {
        throw new Error("should be grater then 0")
    }

    try {
        // check is Partner exist in our database
        const customerExists = await Customer.findById(customerId);
        if (!customerExists) {
            throw new Error("Customer not found");
        }

        // check if user have a wallet, else return
        const wallet = await validateCustomerWallet(customerExists._id);

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        walletId = wallet._id;

        const resp = await updateCustomerWallet(customerId, amount, transsactionType, wallet);
        // create wallet transaction

        if (resp) {
            await createWalletTransaction(customerId, userType, walletId, amount, title, transsactionType, status, "transaction successfull");
            return resp;
        }
    } catch (error) {
        throw new Error(error.message ? error.message : "Error encountered.");
        // return res.status(500).json({ message: error.message ? error.message : "Error encountered." });
    }
}


/**
 * @openapi
 * /wallet/partner/maketransaction:
 *  post:
 *    summary: you can Make partner transaction in wallet
 *    tags:
 *    - wallet Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                amount:
 *                  type: number
 *                  description: required should be number
 *                transsactionType:
 *                  type: string
 *                  description: required and it can be a credit,debit
 *                status:
 *                  type: string
 *                  description: not required default is successful if u wanna pass it can be successful,pending,failed
 *                title:
 *                  type: string  not required
 * 
 *    responses:
 *      200:
 *          description: wallet funded successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
 *      400:
 *         description: if the parameters given were invalid or bad request
 *         content:
 *           application/json:
 *             schema:
 *               required:
 *               - errors
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   description: a list of validation errors
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: object
 *                         description: the value received for the parameter
 *                       msg:
 *                         type: string
 *                         description: a message describing the validation error
 *                       param:
 *                         type: string
 *                         description: the parameter for which the validation error occurred
 *                       location:
 *                         type: string
 *                         description: the location at which the validation error occurred (e.g. query, body)
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 */
router.post("/partner/maketransaction", checkPartner, validateWallletBodyValidator, rejectBadRequests, async (req, res) => {
    let { status, amount, title, transsactionType } = req.body;
    const partnerId = req.partner._id;

    try {
        const resp = await makePartnerTranssaction("partner", status, partnerId, amount, title, transsactionType);
        if (resp) {
            return res.status(200).json({
                response: "wallet funded successfully",
                data: resp,
            });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message ? error.message : "Error encountered." });
    }
});


/**
 * @openapi
 * /wallet/customer/maketransaction:
 *  post:
 *    summary: you can Make customer transaction in wallet
 *    tags:
 *    - wallet Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                customerId:
 *                  type: string
 *                  description: required
 *                amount:
 *                  type: number
 *                  description: required should be number
 *                transsactionType:
 *                  type: string
 *                  description: required and it can be a credit,debit
 *                status:
 *                  type: string
 *                  description: not required default is successful if u wanna pass it can be successful,pending,failed
 *                title:
 *                  type: string  not required
 * 
 *    responses:
 *      200:
 *          description: wallet funded successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
 *      400:
 *         description: if the parameters given were invalid or bad request
 *         content:
 *           application/json:
 *             schema:
 *               required:
 *               - errors
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   description: a list of validation errors
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: object
 *                         description: the value received for the parameter
 *                       msg:
 *                         type: string
 *                         description: a message describing the validation error
 *                       param:
 *                         type: string
 *                         description: the parameter for which the validation error occurred
 *                       location:
 *                         type: string
 *                         description: the location at which the validation error occurred (e.g. query, body)
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 */
router.post("/customer/maketransaction", checkCustomer, validateCustomerWallletBodyValidator, rejectBadRequests, async (req, res) => {
    let { status, amount, title, transsactionType } = req.body;
    const customerId = req.Customer._id;

    try {
        const resp = await makeCustomerTranssaction("customer", status, customerId, amount, title, transsactionType);
        if (resp) {
            return res.status(200).json({
                response: "wallet funded successfully",
                data: resp,
            });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message ? error.message : "Error encountered." });
    }
});


/**
 * @openapi
 * /wallet/transaction/partner:
 *  get:
 *    summary: fetch all wallet transaction in assending order by date
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get('/transaction/partner', checkPartner, async (req, res) => {
    const id = req.partner._id;
    try {
        const data = await getWallletTranssaction(id, "partner");
        return res.status(200).json({ message: "partner Transsaction list", data })
    } catch (error) {
        return res.status(500).json({ message: error.message ? error.message : "Error encountered while trying to fetch transaction." });
    }
})

/**
 * @openapi
 * /wallet/transaction/customer:
 *  get:
 *    summary: fetch all wallet transaction in assending order by date
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get('/transaction/customer', checkCustomer, async (req, res) => {
    const id = req.Customer._id;
    try {
        const data = await getWallletTranssaction(id, "customer");
        return res.status(200).json({ message: "customer Transsaction list", data })
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error encountered while trying to fetch transaction." });
    }
})

/**
 * @openapi
 * /wallet/partner:
 *  get:
 *    summary: used to get wallet of partner
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get('/partner', checkPartner, async (req, res) => {
    const id = req.partner._id;
    try {
        const data = await Wallet.findOne({ partnerId: id });
        if (data) {
            return res.status(200).json({ message: "wallet state", data });
        } else {
            return res.status(404).json({ message: "wallet not found" });
        }
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error encountered while trying to fetching wallet" });
    }
})

/**
 * @openapi
 * /wallet/customer:
 *  get:
 *    summary: used to get wallet of customer
 *    tags:
 *    - wallet Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.get('/customer', checkCustomer, async (req, res) => {
    const id = req.Customer._id;

    try {
        const data = await CustomerWallet.findOne({ customerId: id })
        if (data) {
            return res.status(200).json({ message: "wallet state", data });
        } else {
            return res.status(404).json({ message: "wallet not found" });
        }
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error encountered while trying to fetching wallet" });
    }
})



module.exports = router;