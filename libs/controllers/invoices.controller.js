class InvoicesController {
    // async createCustomerOrder(orderId,customerId) {
    //     try {
    //       const resp = await sdk.CreateOrder(
    //         {
    //           customer_details: {
    //             customer_id: data.customerid,
    //             customer_email: data.email,
    //             customer_phone: data.phone,
    //           },
    //           order_id: data.OrderId,
    //           order_amount: data.Amount,
    //           order_currency: "INR",
    //         },
    //         {
    //           "x-client-id": this.APPID,
    //           "x-client-secret": this.APPSECRET,
    //           "x-api-version": "2022-01-01",
    //         }
    //       );
    //       if (!resp || !resp.order_token) {
    //         throw new Error("Couldn't Create the Order transaction");
    //       }
    //       const existingOrderId = data.OrderId.split("-")[0];
    
    //       const newTransaction = await this.createTranssaction({
    //         ...resp,
    //         // ourorder_id: data.ourorder_id,
    //         order_id: existingOrderId,
    //         cashfreeOrderId: data.OrderId,
    //       });
    //       await newTransaction.save();
    //       // this is move down to
    //       // await ordersModel.findOneAndUpdate(
    //       //   { OrderId: existingOrderId },
    //       //   { $push: { TxnId: newTransaction._id } },
    //       //   { new: true }
    //       // );
    
    //       return newTransaction;
    //     } catch (error) {
    //       console.log(error);
    //       throw new Error("Couldn't Create the Order transaction");
    //     }
    //   }
}


module.exports = new InvoicesController();