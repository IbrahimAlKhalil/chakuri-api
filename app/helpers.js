const jwt = require('jsonwebtoken');

const Env = use('Env');
const Token = use('App/Models/Token');
const VerificationToken = use('App/Models/VerificationToken');
const Notification = use('App/Models/Notification');
const Encryption = use('Encryption');
const crypto = require('crypto');
const db = use('Database');
const {validate} = use('Validator');
const io = require('../start/socket');

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
        expires_in: 3600,
      },
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
          `${now.getFullYear()}-${zeroPrefix(now.getMonth() + 1)}-${zeroPrefix(now.getDate())} ${zeroPrefix(now.getHours())}:${zeroPrefix(now.getMinutes())}:${zeroPrefix(now.getSeconds())}`,
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

  bnToEn(bnNumbs) {
    const str = bnNumbs.toString();
    const translations = {
      '০': 0,
      '১': 1,
      '২': 2,
      '৩': 3,
      '৪': 4,
      '৫': 5,
      '৬': 6,
      '৭': 7,
      '৮': 8,
      '৯': 9,
    };

    return str.replace(/[০১২৩৪৫৬৭৮৯]/gm, (match) => {
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

    verification.token = token || crypto.randomBytes(20).toString('hex');
    await verification.save();


    return Promise.resolve(verification);
  },

  wait(duration) {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  },

  async notify(payload) {
    const notification = await Notification.create(payload);

    io.to('u-' + notification.user_id).emit('n', notification);
  },

  async moderators() {
    return JSON.parse(await redisClient.getAsync('moderators'));
  },

  async loadModerators() {
    const users = await db.query()
      .select('u.id', 'r.name as role')
      .from('users as u')
      .join('role_user as ru', 'ru.user_id', 'u.id')
      .join('roles as r', 'r.id', 'ru.role_id')
      .where('user_type_id', 3)
      .where('disabled', 0);

    const moderators = [];

    for (const user of users) {
      const permissions = await db.query()
        .distinct('p.name')
        .from('role_user as ru')
        .join('role_permission as rp', 'rp.role_id', 'ru.role_id')
        .join('permissions as p', 'p.id', 'rp.permission_id')
        .where('ru.user_id', user.id);

      moderators.push({
        id: user.id,
        admin: user.role === 'Admin',
        permissions: permissions.map(item => item.name),
      });
    }

    await redisClient.setAsync('moderators', JSON.stringify(moderators));
  },

  async loadSettings() {
    const settings = await db.table('settings');

    for (const setting of settings) {
      await redisClient.setAsync(`setting-${setting.name}`, setting.value);
    }
  },

  async buildSearchQuery(request, cols, query, call) {
    const keyword = request.input('keyword');

    if (!keyword) {
      return;
    }

    if (call) {
      await call(query);
    }

    const keywords = keyword.trim().split(' ').join('|');

    let conditions = '';

    cols.forEach((col, index) => {
      conditions += `${col} regexp ?`;

      if (index !== cols.length - 1) {
        conditions += ' or ';
      }
    });

    query.whereRaw(`(${conditions})`, new Array(cols.length).fill(keywords));
  },

  async paginate(request, query) {
    const page = Number(request.input('page', 1));
    const perPage = Number(request.input('perPage', 6));
    const take = request.input('take', perPage);

    const pagination = await query.paginate(page || 1, perPage);

    if (take !== perPage) {
      const {length} = pagination.data;

      const start = length - take;

      pagination.data = pagination.data.slice(start < 1 ? 0 : start, length);
    }

    return pagination;
  },

  async update(request, fields, table, id) {
    const updateData = {};

    fields.forEach(field => {
      const data = request.input(field);

      if (data) {
        updateData[field] = data;
      }
    });

    if (Object.keys(updateData).length) {
      await db.query()
        .from(table)
        .where('id', id)
        .update(updateData);
    }
  },

  async validateIndex(request, fields = [], rules = {}) {
    const validation = await validate(request.only(['perPage', 'page', 'take', 'keyword', ...fields]), {
      perPage: 'integer|max:30',
      page: 'integer|min:1',
      take: 'integer|max:30',
      keyword: 'string',
      ...rules,
    });

    return !validation.fails();
  },
};

module.exports = helpers;
