const express = require('express');
const router = express.Router();
/* Shop Manager has all of our Shop Logic */
const shopmanager = require('../shop-manager');
/* Local Models */
const teacherModel = require('../models/teacher');
const voucherModel = require('../models/voucher');

router.get('/', (req, res, next) => {
    return res.json({"data": "SA shop endpoint"}).end();
});

/* List all of the JSON data from our Shop Manager */
router.get('/products', async (req, res, next) => {
    return res.json(shopmanager);
});

/* Request a purchase of the item through shop manager*/
router.post('/buy/:id', async (req, res, next) => {
    // Get the shop item by request ID
    let shopItem = shopmanager[req.params.id];
    if (!shopItem)
        return res.json({"err": "The item was not found in the shop."}).end();
    // Ensure the customer has adequate funds for purchase
    if (req.user.balance < shopItem.cost)
        return res.json({"err": "Insufficient funds available in the account."});
    // Run preflight checks (do they own it yet?)
    if (!await shopItem.preflight(req.user, req.body))
        return res.json({"err": "Failed preflight check. The user most likely already has the item."});
    // Reduce the users balance by the shop item amount
    req.user.reduceBalance(shopItem.cost);
    // Run the purchase logic in the shop manger
    shopItem.onBuy(req.user, req.body);
    return res.json({"data": "success"});
});

/* Redeem a Voucher code for Balance (Coins) */
router.post('/redeem/:vcode', async (req, res, next) => {
    // Get the voucher model and check if it exists
    let voucher = await voucherModel.getVoucherByCode(req.params.vcode);
    if(!voucher)
        return res.json({"err":"The voucher code was not found in the system."}).end();
    // Reduce the vouchers available uses
    voucher.useVoucher();
    // Increase the users balance by the vouchers value
    req.user.increaseBalance(voucher.value);
    return res.json({"data":"The voucher was used successfully."})
});

/* List the teachers currently available for hire */
router.get('/teachers', async (req, res, next) => {
    let teachers = await teacherModel.getAllWithoutTarget();
    return res.json(teachers);
});

module.exports = router;
