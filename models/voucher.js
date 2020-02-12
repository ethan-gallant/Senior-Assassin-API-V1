const neodb = require('../neodb');

class Voucher {
    constructor(data) {
        this.code = data.Code;
        this.uses = data.UsesLeft;
        this.value = data.Value;
    }

    useVoucher() {
        neodb.getSession().run(
            'MATCH (v:Voucher {Code:$code}) SET v.UsesLeft = v.UsesLeft - 1',
            {
                code: this.code
            }
        );
    }
}

exports.getVoucherByCode = async (vcode) => {
    const data = await neodb.getSession().run(
        'MATCH (v:Voucher) where v.Code = $code AND v.UsesLeft > 0 RETURN v;',
        {
            code: vcode
        }
    );

    const singleRecord = data.records[0];
    if (!singleRecord)
        return null;
    const node = singleRecord.get(0);
    return new Voucher(node.properties);
};
