const crypto = require('crypto')
const Encryption = use('Encryption')

exports.generateToken = function (id) {
    return Encryption.encrypt(crypto.randomBytes(4).toString() + id)
}

exports.truncateMobile = function (mobile) {
    if (mobile.match(/^\+?880/)) {
        return mobile.slice(mobile.charAt(0) === '+' ? 3 : 2)
    }

    return mobile
}
