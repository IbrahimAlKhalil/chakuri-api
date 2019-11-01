const jwt = require('jsonwebtoken');

const Env = use('Env');
const Token = use('App/Models/Token');
const VerificationToken = use('App/Models/VerificationToken');
const Notification = use('App/Models/Notification');
const Encryption = use('Encryption');
const crypto = require('crypto');
const fetch = require('node-fetch');
const FormData = require('form-data');
const db = use('Database');

const helpers = {
    truncateMobile(mobile) {
        if (mobile.match(/^\+880/)) {
            return mobile.slice(3);
        }

        return mobile;
    },

    randomNumber(maximum = 10, minimum = 1) {
        return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    },

    putStringAt(source, str, index) {
        return `${source.slice(0, index)}${str}${source.slice(index)}`;
    },

    zeroPrefix(num) {
        if (num < 10) {
            return `0${num}`;
        }

        return num.toString();
    },

    formatJwt(userId, token) {
        return {
            userId,
            jwt: {
                access_token: token,
                expires_in: 3600
            }
        };
    },

    async generateToken(userId, newUser) {
       const {zeroPrefix} = helpers;

        // Check whether the user has already a token alive
        const now = new Date(Date.now() - Env.get('TOKEN_LIFETIME'));

        if (!newUser) {
            const oldToken = await Token.query()
                .where(
                    'updated_at',
                    '>',
                    `${now.getFullYear()}-${zeroPrefix(now.getMonth() + 1)}-${zeroPrefix(now.getDate())} ${zeroPrefix(now.getHours())}:${zeroPrefix(now.getMinutes())}:${zeroPrefix(now.getSeconds())}`
                )
                .where('user_id', userId)
                .first();

            if (oldToken) {
                return Encryption.decrypt(oldToken.key);
            }
        }


        const token = new Token;
        token.user_id = userId;
        await token.save();

        const key = jwt.sign({
            keyid: token.id,
        }, Env.get('APP_KEY'));

        token.key = Encryption.encrypt(key);
        await token.save();

        return key;
    },

    enToBn(enNums) {
        const str = enNums.toString();
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
        };

        return str.replace(/\d/gm, (match) => {
            return translations[match];
        });
    },

    async generateVerification(userId, type, payload, autoDelete = true, token = null) {
// Create verification token
        const verification = new VerificationToken;
        verification.user_id = userId;
        verification.type = type;
        verification.auto_delete = autoDelete;
        verification.payload = payload;
        verification.last_send = Date.now();
        await verification.save();

        verification.token = token || crypto.randomBytes(20).toString('hex') + verification.id;
        await verification.save();


        return Promise.resolve(verification);
    },

    async sendSMS(contacts, msg) {
        if (Env.get('NODE_ENV') === 'development') {
            return;
        }

        const body = new FormData;
        const data = {
            api_key: Env.get('SMS_API_KEY'),
            type: 'text',
            contacts,
            senderid: Env.get('SMS_SENDER_ID'),
            msg,
            method: 'api'
        };

        for (let key in data) {
            body.append(key, data[key]);
        }

        await fetch(`http://portal.smsinbd.com/smsapi`, {
            method: 'POST',
            body
        });
    },

    wait(duration) {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    },

    async notify(payload) {
        await Notification.create(payload);
    },

    moderators: [],

    async loadModerators() {
        const users = await db.query()
            .select('u.id', 'r.name as role')
            .from('users as u')
            .join('role_user as ru', 'ru.user_id', 'u.id')
            .join('roles as r', 'r.id', 'ru.role_id')
            .where('user_type_id', 3)
            .where('disabled', 0);

        for (const user of users) {
            const permissions = await db.query()
                .distinct('p.name')
                .from('role_user as ru')
                .join('role_permission as rp', 'rp.role_id', 'ru.role_id')
                .join('permissions as p', 'p.id', 'rp.permission_id')
                .where('ru.user_id', user.id);

            helpers.moderators.push({
                id: user.id,
                admin: user.role === 'Admin',
                permissions: permissions.map(item => item.name)
            });
        }
    },

    removeModerator(id) {
        let key;

        helpers.moderators.some((moderator, index) => {
            const ok = moderator.id === id;

            if (ok) {
                key = index;
            }

            return ok;
        });

        if (key) {
            helpers.moderators.splice(key, 1);
        }
    },

    addModerator(moderator) {
        helpers.moderators.push(moderator);
    }
};

module.exports = helpers;

/*exports.truncateMobile = function (mobile) {
    if (mobile.match(/^\+880/)) {
        return mobile.slice(3);
    }

    return mobile;
};

exports.randomNumber = function (maximum = 10, minimum = 1) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

exports.putStringAt = function (source, str, index) {
    return `${source.slice(0, index)}${str}${source.slice(index)}`;
};

const zeroPrefix = function (num) {
    if (num < 10) {
        return `0${num}`;
    }

    return num.toString();
};

exports.zeroPrefix = zeroPrefix;

exports.formatJwt = function (userId, token) {
    return {
        userId,
        jwt: {
            access_token: token,
            expires_in: 3600
        }
    };
};

exports.generateToken = async function (userId, newUser) {
    // Check whether the user has already a token alive
    const now = new Date(Date.now() - Env.get('TOKEN_LIFETIME'));

    if (!newUser) {
        const oldToken = await Token.query()
            .where(
                'updated_at',
                '>',
                `${now.getFullYear()}-${zeroPrefix(now.getMonth() + 1)}-${zeroPrefix(now.getDate())} ${zeroPrefix(now.getHours())}:${zeroPrefix(now.getMinutes())}:${zeroPrefix(now.getSeconds())}`
            )
            .where('user_id', userId)
            .first();

        if (oldToken) {
            return Encryption.decrypt(oldToken.key);
        }
    }


    const token = new Token;
    token.user_id = userId;
    await token.save();

    const key = jwt.sign({
        keyid: token.id,
    }, Env.get('APP_KEY'));

    token.key = Encryption.encrypt(key);
    await token.save();

    return key;
};

exports.enToBn = function (enNums) {
    const str = enNums.toString();
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
    };

    return str.replace(/\d/gm, (match) => {
        return translations[match];
    });
};

exports.generateVerification = async function (userId, type, payload, autoDelete = true, token = null) {
// Create verification token
    const verification = new VerificationToken;
    verification.user_id = userId;
    verification.type = type;
    verification.auto_delete = autoDelete;
    verification.payload = payload;
    verification.last_send = Date.now();
    await verification.save();

    verification.token = token || crypto.randomBytes(20).toString('hex') + verification.id;
    await verification.save();


    return Promise.resolve(verification);
};

exports.sendSMS = async function (contacts, msg) {
    if (Env.get('NODE_ENV') === 'development') {
        return;
    }

    const body = new FormData;
    const data = {
        api_key: Env.get('SMS_API_KEY'),
        type: 'text',
        contacts,
        senderid: Env.get('SMS_SENDER_ID'),
        msg,
        method: 'api'
    };

    for (let key in data) {
        body.append(key, data[key]);
    }

    await fetch(`http://portal.smsinbd.com/smsapi`, {
        method: 'POST',
        body
    });
};

exports.wait = duration => {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
};

exports.notify = async function (payload) {
    await Notification.create(payload);
};


const moderators = [];
exports.moderators = moderators;

exports.loadModerators = async function () {
    const users = await db.query()
        .select('u.id', 'r.name as role')
        .from('users as u')
        .join('role_user as ru', 'ru.user_id', 'u.id')
        .join('roles as r', 'r.id', 'ru.role_id')
        .where('user_type_id', 3);

    for (const user of users) {
        const permissions = await db.query()
            .distinct('p.name')
            .from('role_user as ru')
            .join('role_permission as rp', 'rp.role_id', 'ru.role_id')
            .join('permissions as p', 'p.id', 'rp.permission_id')
            .where('ru.user_id', user.id);

        moderators.push({
            id: user.id,
            admin: user.role === 'admin',
            permissions: permissions.map(item => item.name)
        });
    }
};

exports.removeModerator = function (id) {
    let key;

    moderators.some((moderator, index) => {
        const ok = moderator.id === id;

        if (ok) {
            key = index;
        }

        return ok;
    });

    if (key) {
        moderators.splice(key, 1);
    }
};

exports.addModerator = function (moderator) {
    moderators.push(moderator);
};*/
