const router = require("express").Router();
const { transsactionTypes, transsactionStatus } = require('../enums/types');
const { WalletTransaction, Wallet, Partner } = require("../models")
const { body } = require("express-validator");
const { rejectBadRequests } = require('../middleware');

const validateWallletBodyValidator = [
    body("partnerId")
        .notEmpty()
        .withMessage("partnerId required")
        .isString()
        .withMessage("partnerId should be string"),
    body("amount")
        .notEmpty()
        .withMessage("amount cannot be empty")
        .not().isString()
        .withMessage("invalid type of amount")
];

const validateUserWallet = async (id) => {
    try {
        // check if user have a wallet, else create wallet
        const userWallet = await Wallet.findOne({ partnerId: id });
        // If user wallet doesn't exist
        if (!userWallet) {
            throw new Error("doesn't exist")
        }
        return userWallet;
    } catch (error) {
        throw new Error("Something went wrong")
    }
};



const createWalletTransaction = async (partnerId, walletId, balance, title, transsactionType, status, reason) => {

    if (!transsactionTypes.includes(transsactionType)) {
        throw new Error('Invalid transsactionType')
    }
    if (!transsactionStatus.includes(status)) {
        throw new Error('Invalid status')
    }

    try {
        // create wallet transaction
        const walletTransaction = new WalletTransaction({
            balance,
            partnerId,
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

const updateWallet = async (partnerId, amount, transsactionType, currentWallet) => {
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


/**
 * @openapi
 * /wallet/transaction:
 *  post:
 *    summary: you can Make transaction in your wallet
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                partnerId:
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
router.post("/transaction", validateWallletBodyValidator, rejectBadRequests, async (req, res) => {
    let { status, partnerId, amount, title, transsactionType } = req.body;
    let walletId;

    if (!status || status === "") {
        status = "successful";
    }

    if (amount < 1) {
        return res
            .status(404)
            .json({ message: "should be grater then 0" });
    }

    try {
        // check is Partner exist in our database
        const partnerExists = await Partner.findById(partnerId);
        if (!partnerExists) {
            return res
                .status(404)
                .json({ message: "partner not found" });
        }

        // check if user have a wallet, else return
        const wallet = await validateUserWallet(partnerExists._id);

        if (!wallet) {
            return res
                .status(404)
                .json({ message: "Wallet not found" });
        }

        walletId = wallet._id;

        const resp = await updateWallet(partnerId, amount, transsactionType, wallet);
        // create wallet transaction

        if (resp) {
            await createWalletTransaction(partnerId, walletId, amount, title, transsactionType, status, "transaction successfull");
            return res.status(200).json({
                response: "wallet funded successfully",
                data: resp,
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message ? error.message : "Error encountered." });
    }
});



module.exports = router;