const BASE44 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-*/";

function encodeBase44(buffer) {
    let num = BigInt('0x' + buffer.toString('hex'));
    let result = '';

    while (num > 0n) {
        result = BASE44[num % 44n] + result;
        num = num / 44n;
    }

    return result || "A";
}

module.exports = { encodeBase44 };
