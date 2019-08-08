const jwt = require('jsonwebtoken')

const Env = use('Env')
const Token = use('App/Models/Token')
const Encryption = use('Encryption')


exports.truncateMobile = function (mobile) {
    if (mobile.match(/^\+880/)) {
        return mobile.slice(3)
    }

    return mobile
}

exports.randomNumber = function (maximum = 10, minimum = 1) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

exports.putStringAt = function (source, str, index) {
    return `${source.slice(0, index)}${str}${source.slice(index)}`
}

const zeroPrefix = function (num) {
    if (num < 10) {
        return `0${num}`
    }

    return num.toString()
}

exports.zeroPrefix = zeroPrefix

exports.formatJwt = function (userId, token) {
    return {
        userId,
        jwt: {
            access_token: token,
            expires_in: 3600
        }
    }
}

exports.generateToken = async function (userId, newUser) {
    // Check whether the user has already a token alive
    const now = new Date(Date.now() - Env.get('TOKEN_LIFETIME'))

    if (!newUser) {
        const oldToken = await Token.query()
            .where(
                'updated_at',
                '>',
                `${now.getFullYear()}-${zeroPrefix(now.getMonth() + 1)}-${zeroPrefix(now.getDate())} ${zeroPrefix(now.getHours())}:${zeroPrefix(now.getMinutes())}:${zeroPrefix(now.getSeconds())}`
            )
            .where('user_id', userId)
            .first()

        if (oldToken) {
            return Encryption.decrypt(oldToken.key)
        }
    }


    const token = new Token
    token.user_id = userId
    await token.save()

    const key = jwt.sign({
        keyid: token.id,
    }, Env.get('APP_KEY'))

    token.key = Encryption.encrypt(key)
    await token.save()

    return key
}

exports.enToBn = function (enNums) {
    const str = enNums.toString()
    const translations = {
        0: '০',
        1: '১',
        2: '২',
        3: '৩',
        4: '৪',
        5: '৫',
        6: '৬',
        7: '৭',
        8: '৮',
        9: '৯',
    }

    return str.replace(/\d/gm, (match) => {
        return translations[match]
    })
}

