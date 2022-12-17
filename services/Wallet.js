const { transsactionTypes, transsactionStatus } = require("../enums/types");
const {
  WalletTransaction,
  PartnerWallet,
  Partner,
  CustomerWallet,
  Customer,
} = require("../models");

const getPartnerWallet = async (id) => {
  try {
    // check if user have a wallet, else create wallet
    let userWallet = null;
    userWallet = await PartnerWallet.findOne({ partnerId: id });
    // If user wallet doesn't exist
    if (!userWallet) {
      userWallet = await PartnerWallet.create({ partnerId: id });
    }
    return userWallet;
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

const getCustomerWallet = async (id) => {
  try {
    // check if user have a wallet, else create wallet
    let userWallet = null;
    userWallet = await CustomerWallet.findOne({ customerId: id });
    
    // If user wallet doesn't exist
    if (!userWallet) {
      userWallet = await CustomerWallet.create({ customerId: id });
    }
    return userWallet;
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

const getAllWallletTranssactionForUser = async (id, type) => {
  if (type !== "partner" && type !== "customer") {
    throw new Error("Invalid transsactionUser");
  }

  try {
    let wallet =
      type === "partner"
        ? await getPartnerWallet(id)
        : await getCustomerWallet(id);

    const data = await WalletTransaction.find({
      walletId: wallet?._id,
    }).sort({ createdAt: -1 });
    return data;
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

const getWallletTransactionByTransactionId = async (id) => {
  try {
    const data = await WalletTransaction.findOne({ tranId: id });
    return data;
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

const updateWallletTransactionByTransactionId = async (id, status) => {
  try {
    const data = await WalletTransaction.findOneAndUpdate(
      { tranId: id },
      { status },
      { new: true }
    );
    return data;
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

const createWalletTransaction = async (
  userId,
  transsactionUser,
  walletId,
  amount,
  title,
  transsactionType,
  status,
  reason
) => {
  if (!transsactionTypes.includes(transsactionType)) {
    throw new Error("Invalid transsactionType");
  }
  if (!transsactionStatus.includes(status)) {
    throw new Error("Invalid status");
  }

  if (!userId) {
    throw new Error("userId required");
  }

  try {
    // create wallet transaction
    const walletTransaction = await new WalletTransaction({
      amount,
      userId: transsactionUser === "partner" ? userId : null,
      userId: transsactionUser === "customer" ? userId : null,
      transsactionUser: transsactionUser,
      walletId,
      title,
      transsactionType,
      status,
      reason,
    });
    return walletTransaction.save();
  } catch (error) {
    throw new Error("Error accure");
  }
};

const getWalletTransactions = async () => {
  try {
    let transactions = await WalletTransaction.find();
    let wallet;
    const populateUserdata = async (transaction) => {
      try {
        if (transaction?.transsactionUser === "partner") {
          let obj = {
            tranId: transaction.tranId,
            transsactionUser: transaction.transsactionUser,
            amount: transaction.amount,
            title: transaction.title,
            reason: transaction.reason,
            transsactionType: transaction.transsactionType,
            status: transaction.status,
            createdAt: transaction.createdAt,
          };
          wallet = await PartnerWallet.findById(transaction?.walletId);
          obj.user = await Partner.findById(wallet?.partnerId);
          return obj;
        }
        return obj;
      } catch (error) {}
    };
    let trans = await Promise.all(
      transactions.map((item) => {
        return populateUserdata(item);
      })
    );
    return trans;
  } catch (error) {
    throw new Error("Error fetching wallet transactions");
  }
};

const updatePartnerWallet = async (userId, amount, transsactionType) => {
  let wallet = await getPartnerWallet(userId);
  let finalAmount = 0;
  if (transsactionType === "credit") {
    finalAmount = amount;
  } else {
    if (wallet.balance - amount < 0) {
      throw new Error("insufficient wallet balance");
    }
    finalAmount = -amount;
  }

  try {
    // update wallet
    const wallet = await PartnerWallet.findOneAndUpdate(
      { partnerId: userId },
      { $inc: { balance: finalAmount } },
      { new: true }
    );
    return wallet;
  } catch (error) {
    throw new Error("Error accure unable to make transaction");
  }
};

const updateCustomerWallet = async (
  userId,
  amount,
  transsactionType,
  currentWallet
) => {
  let finalAmount = 0;

  if (transsactionType === "credit") {
    finalAmount = amount;
  } else {
    if (currentWallet.balance - amount < 0) {
      throw new Error("insufficient wallet balance");
    }
    finalAmount = -amount;
  }

  try {
    // update wallet
    return await CustomerWallet.findOneAndUpdate(
      { customerId:userId },
      { $inc: { balance: finalAmount } },
      { new: true }
    );
  } catch (error) {
    throw new Error("Error accure unable to make transaction");
  }
};

const makePartnerTranssaction = async (
  userType,
  status,
  userId,
  amount,
  title,
  transsactionType
) => {
  let walletId;

  if (!status || status === "") {
    status = "successful";
  }

  if (amount < 1) {
    throw new Error("should be grater then 0");
  }

  try {
    // check is Partner exist in our database
    const partnerExists = await Partner.findById(userId);
    if (!partnerExists) {
      throw new Error("partner not found");
    }

    // check if user have a wallet, else return
    const wallet = await getPartnerWallet(partnerExists._id);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    walletId = wallet._id;

    const resp = await updatePartnerWallet(
      userId,
      amount,
      transsactionType,
      wallet
    );
    // create wallet transaction

    if (resp) {
      await createWalletTransaction(
        userId,
        userType,
        walletId,
        amount,
        title,
        transsactionType,
        status,
        "transaction successfull"
      );
      return resp;
    }
  } catch (error) {
    throw new Error(error.message ? error.message : "Error encountered.");
  }
};

const makeCustomerTranssaction = async (
  userType,
  status,
  userId,
  amount,
  title,
  transsactionType
) => {
  let walletId;

  if (!status || status === "") {
    status = "successful";
  }

  if (amount < 1) {
    throw new Error("should be grater then 0");
  }

  try {
    // check is Partner exist in our database
    const customerExists = await Customer.findById(userId);
    if (!customerExists) {
      throw new Error("Customer not found");
    }

    // check if user have a wallet, else return
    const wallet = await getCustomerWallet(customerExists._id);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    walletId = wallet._id;

    const resp = await updateCustomerWallet(
      userId,
      amount,
      transsactionType,
      wallet
    );
    // create wallet transaction
    if (resp) {
      await createWalletTransaction(
        userId,
        userType,
        walletId,
        amount,
        title,
        transsactionType,
        status,
        "transaction successfull"
      );
      return resp;
    }
  } catch (error) {
    throw new Error(error.message ? error.message : "Error encountered.");
    // return res.status(500).json({ message: error.message ? error.message : "Error encountered." });
  }
};

module.exports = {
  getPartnerWallet,
  getCustomerWallet,
  getAllWallletTranssactionForUser,
  getWallletTransactionByTransactionId,
  updateWallletTransactionByTransactionId,
  createWalletTransaction,
  getWalletTransactions,
  updatePartnerWallet,
  updateCustomerWallet,
  makePartnerTranssaction,
  makeCustomerTranssaction,
};
