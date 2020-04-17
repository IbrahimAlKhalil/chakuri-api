'use strict';

const User = use('App/Models/User');
const File = use('App/Models/File');
const Helpers = use('Helpers');
const PasswordReset = use('App/Models/PasswordReset');
const Drive = use('Drive');
const db = use('Database');
const VerificationToken = use('App/Models/VerificationToken');
const Resume = use('App/Models/Resume');
const {validate} = use('Validator');
const Hash = use('Hash');
const Route = use('Route');
const Mail = use('Mail');
const crypto = require('crypto');
const emailTemplate = require('../../../templates/email-verification');
const {truncateMobile, generateVerification, sendSMS, bnToEn} = require('../../helpers');

// TODO: Make use of verified middleware

class UserController {

  async register({request, response, auth}) {
    const minPassword = await getSetting('minPassword');

    // Validate only password, name. Other inputs will be validated by userExists method
    const validation = await validate(request.only(['password', 'name']), {
      password: `required|min:${minPassword}`,
      name: 'required|string|max:190',
    });

    // Validate password and name
    // mobile, user_type_id will be validated by userExists method
    if (validation.fails() || await this.userExists({request}, true)) {
      return response.status(422).send('');
    }

    const data = request.only(['user_type_id', 'mobile', 'password', 'name']);
    const type = Number(request.input('user_type_id'));
    data.mobile = bnToEn(data.mobile);

    // Create user
    const user = await User.create(data);

    // Create a resume for employee
    if (type === 1) {
      await Resume.create({
        user_id: user.id,
        mobile: user.mobile,
        nationality: 'বাংলাদেশী',
      });
    } else if (type === 2) {
      await db.table('institutions')
        .insert({user_id: user.id});
    }


    // Generate verification token
    const verification = await generateVerification(user.id, 'mobile', user.mobile, false, Math.floor(100000 + Math.random() * 900000));


    // Send verification code
    await sendSMS(user.mobile, `Your verification code from Khidmat is ${verification.token}`);


    // Attempt to login
    return await auth.login(
      user.mobile,
      request.input('password'),
      user.user_type_id,
      false,
      user.id,
    );
  }

  async userExists({request, response}, register = false) {

    const validation = await validate(
      request.only(['user_type_id', 'mobile']), {
        user_type_id: 'required|in:1,2' + (!register ? ',3' : ''),
        mobile: 'required|mobile',
      });

    // If validation fails response with 422 status
    // If the status is 422 then the client must think that the data is invalid
    // If status is 200 then the client must look at the response
    if (validation.fails()) {
      // The register method also uses this method to
      // check user availability, and that is why the register
      // method doesn't validate user_type_id, mobile, email
      // so if validation fails then return true and register
      // method will response with status 422

      if (response) {
        return response.status(422).send('');
      }

      return true;
    }

    const type = request.input('user_type_id');

    return await UserController.exists(
      'mobile',
      truncateMobile(bnToEn(request.input('mobile'))),
      type,
    );
  }

  async updateName({request, auth, response}) {
    const validation = await validate(request.only(['name']), {
      name: 'required|max: 190',
    });

    if (validation.fails()) {
      return response.status(422).send('');
    }

    await User.query()
      .update({name: request.input('name')})
      .where('id', auth.id);

    return '';
  }

  async updateEmail({request, auth, response}) {

    const validation = await validate(request.only(['email', 'password']), {
      email: 'required|email',
      password: 'required|min:8',
    });

    // Validate user input
    if (validation.fails()) {
      return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন');
    }


    // Fetch user instance
    const user = await User.query()
      .select('password', 'email', 'user_type_id as type')
      .where('id', auth.id)
      .first();


    const email = request.input('email');

    // Check whether email is already taken or not
    const emailExists = await UserController.exists('email', email, user.type);

    if (emailExists) {
      return response.status(422).send('দুঃখিত, ইমেইলটি ইতোমধ্যেই কেউ ব্যবহার করছে');
    }

    // Retrieve pending verification
    const oldToken = await db.raw(`
          select payload, type
          from verification_tokens
          where user_id = ${auth.id}
            and created_at >= date_sub(NOW(), interval 1 hour)
            and type = 'email'
        `);

    // User should request twice
    if (oldToken[0].length > 0) {
      return response.status(422).send('');
    }

    // New and previous email should be different
    if (user.email === email) {
      return response.status(422).send('');
    }

    // Verify password
    const verified = await Hash.verify(request.input('password'), user.password);

    // exit if password is not correct
    if (!verified) {
      return response.status(422).send('দুঃখিত, পাসওয়ার্ডটি সঠিক নয় ');
    }


    // Create verification token
    const verification = await generateVerification(auth.id, 'email', email);

    const action = Route.url('email-verification', {token: verification.token});

    // Send email
    const template = emailTemplate({
      company: 'KhidmatBD',
      message: 'ইমেইল ভেরিফিকেশন করতে নিচের বাটনে ক্লিক করুন',
      action: 'https://khidmatbd.com' + action,
      address: 'Kajla, Vangapress, Jatrabari, Dhaka 1236, Bangladesh',
    });

    try {
      await Mail.raw(template, message => {
        message.to(email);
        message.subject('Email verification');
      });
    } catch (e) {
    }

    return '';
  }

  async updateMobile({request, auth, response}) {
    const validation = await validate(request.only(['mobile', 'password']), {
      mobile: 'required|mobile',
      password: 'required|min:8',
    });

    // Validate user input
    if (validation.fails()) {
      return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন');
    }

    const mobile = request.input('mobile');

    const oldToken = await db.raw(`
      select payload, type
      from verification_tokens
      where user_id = ?
        and created_at >= date_sub(NOW(), interval 1 hour)
        and type = 'mobile'
    `, [auth.id]);

    // User should not request twice
    if (oldToken[0].length > 0) {
      return response.status(422).send('');
    }

    // Fetch user instance
    const user = await User.query()
      .select('password', 'mobile')
      .where('id', auth.id)
      .first();

    // Check whether user exists
    if (!user) {
      return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন');
    }

    // New and previous email should be different
    if (user.mobile === mobile) {
      return response.status(422).send('');
    }

    // Verify password
    const verified = await Hash.verify(request.input('password'), user.password);

    // exit if password is not correct
    if (!verified) {
      return response.status(422).send('দুঃখিত, পাসওয়ার্ডটি সঠিক নয় ');
    }


    // Create verification token
    const verification = new VerificationToken;
    verification.user_id = auth.id;
    verification.type = 'mobile';
    verification.payload = mobile;
    await verification.save();

    verification.token = Math.floor(100000 + Math.random() * 900000);
    await verification.save();

    // Send message
    await sendSMS(verification.payload, `Your verification code from Khidmat is ${verification.token}`);

    return '';
  }

  async updatePassword({request, auth, response}) {
    const validation = await validate(request.only(['pass']), {
      pass: 'required|min:8',
    });

    // Validate new password
    if (validation.fails()) {
      return response.status(422).send('সর্বনিম্ন আটটি অক্ষর হতে হবে');
    }

    // Fetch user instance
    const user = await User.query()
      .select('password')
      .where('id', auth.id)
      .first();


    // Verify old password
    const verified = await Hash.verify(request.input('password'), user.password);

    // Validate new password
    if (!verified) {
      return response.status(422).send('দুঃখিত, পাসওয়ার্ডটি সঠিক নয়');
    }


    await User.query()
      .update({password: await Hash.make(request.input('pass'))})
      .where('id', auth.id);

    return '';
  }

  async updatePhoto({request, auth, response}) {
    const photo = await request.file('photo');

    const validation = await validate({photo}, {
      photo: 'required|file|file_types:image',
    });

    // Photo should be included
    if (validation.fails()) {
      return response.status(422).send('');
    }


    // Validate extensions
    const ext = ['png', 'jpg', 'jpeg'];
    if (!ext.includes(photo.subtype)) {
      return response.status(422).send('Sorry! only png and jpeg format supported');
    }

    // Validate size
    if (photo.size > 1e+6) {
      return response.status(422).send('দুঃখিত! ছবি ১ মেগাবাইট এর চেয়ে বড় হতে পারবে না');
    }

    const name = `${new Date().getTime()}.${photo.subtype}`;
    await photo.move(Helpers.publicPath(`files/${auth.id}`), {name});

    const file = new File;
    file.name = `${auth.id}/${name}`;
    file.mime_type = photo.headers['content-type'];
    file.file_type_id = 1;
    await file.save();

    const oldFile = await db.table('users as u')
      .select('f.id', 'f.name as name')
      .join('files as f', 'f.id', 'u.photo')
      .where('u.id', auth.id)
      .first();


    await Promise.all([
      db.table('file_user')
        .insert({
          user_id: auth.id,
          file_id: file.id,
        }),
      db.table('users')
        .update({
          photo: file.id,
        })
        .where('id', auth.id),
    ]);

    // Delete previous file
    if (oldFile) {
      await Promise.all([
        db.table('files')
          .where('id', oldFile.id)
          .delete(),

        Drive.delete(`files/${auth.id}/${oldFile.name}`),
      ]);
    }


    return file.name;
  }

  async updateDescription({request, auth, response}) {
    const validation = await validate(request.only(['description']), {
      description: 'required|max: 3000',
    });

    if (validation.fails()) {
      return response.status(422).send('');
    }

    await db.table('institutions')
      .update({description: request.input('description')})
      .where('user_id', auth.id);

    return '';
  }

  async updateAddress({request, auth, response}) {
    const validation = await validate(request.only(['address']), {
      address: 'required|max: 3000',
    });

    if (validation.fails()) {
      return response.status(422).send('');
    }

    await db.table('institutions')
      .update({address: request.input('address')})
      .where('user_id', auth.id);

    return '';
  }

  async updateCategory({request, auth, response}) {
    const data = request.only(['category']);

    const validation = await validate(data, {
      category: 'required|integer|exists:categories,id',
    });

    if (validation.fails()) {
      return response.status(422).send('দুঃখিত আপনার তথ্যে ভুল আছে');
    }

    await db.from('institutions')
      .update({category_id: data.category})
      .where('user_id', auth.id);

    return '';
  }

  async updateType({request, auth, response}) {
    const data = request.only(['type']);

    const validation = await validate(data, {
      type: 'required|integer|exists:institution_types,id',
    });

    if (validation.fails()) {
      return response.status(422).send('দুঃখিত আপনার তথ্যে ভুল আছে');
    }

    await db.from('institutions')
      .update({institution_type_id: data.type})
      .where('user_id', auth.id);

    return '';
  }

  async getCategoryAndType({auth}) {
    const data = await Promise.all([
      db.from('institutions as i')
        .select(
          'i.category_id',
          'i.institution_type_id as type_id',
          'c.name as category',
          't.name as type',
        )
        .leftJoin('categories as c', 'i.category_id', 'c.id')
        .leftJoin('institution_types as t', 'i.institution_type_id', 't.id')
        .where('user_id', auth.id)
        .first(),
      db.from('categories')
        .select('id', 'name'),
      db.from('institution_types')
        .select('id', 'name'),
    ]);

    return {
      category: {
        options: data[1],
        selected: data[0].category_id ? {
          id: data[0].category_id,
          name: data[0].category,
        } : null,
      },
      type: {
        options: data[2],
        selected: data[0].type_id ? {
          id: data[0].type_id,
          name: data[0].type,
        } : null,
      },
    };
  }

  async resetPassword({request, response}) {
    const data = request.only(['token', 'password', 'rePassword', 'mobile', 'type']);

    const minPassword = await getSetting('minPassword');

    // TODO: Modify min password if necessary
    const validation = await validate(data, {
      token: 'required|string',
      password: `required|min:${minPassword}`,
      rePassword: `required|min:${minPassword}`,
      type: 'required|in:1,2,3',
      mobile: 'required|mobile',
    });

    // Validate request
    if (validation.fails()) {
      // Validation failed
      return response.status(422).send(`দুঃখিত, পাসওয়ার্ড কমপক্ষে ${minPassword} টি অক্ষরের  হতে হবে`);
    }

    // Confirm password
    if (data.password !== data.rePassword) {
      // Didn't match
      return response.status(422).send('দুঃখিত, উপরের এবং নিচের পাসওয়ার্ড মিলছে না');
    }

    // Fetch user by mobile
    const user = await User.query()
      .select('id')
      .where('mobile', data.mobile)
      .where('user_type_id', data.type)
      .where('verified', true)
      .first();

    // User could provide wrong mobile
    if (!user) {
      // User not found
      return response.status(422).send('Sorry, something went wrong, please try later!');
    }

    const reset = await PasswordReset
      .query()
      .select('token', 'id')
      .where('user_id', user.id)
      .first();

    if (!reset) {
      // Token not found
      return response.status(422).send('Sorry, something went wrong, please try later!');
    }

    // Verify token
    if (!Hash.verify(data.token, reset.token)) {
      // Token not found
      return response.status(422).send('Sorry, something went wrong, please try later!');
    }

    await reset.delete();

    user.password = data.password;
    user.save();

    return '';
  }

  async forgotPassword({request, response}) {
    const data = request.only(['type', 'mobile']);

    const validation = await validate(data, {
      type: 'required|in:1,2,3',
      mobile: 'required|mobile',
    });

    // Validate request
    if (validation.fails()) {
      // Validation failed
      return response.status(422).send('');
    }

    // Fetch user by mobile
    const user = await User.query()
      .select('id')
      .where('mobile', data.mobile)
      .where('user_type_id', data.type)
      .where('verified', true)
      .first();

    // User could provide wrong mobile
    if (!user) {
      // User not found
      return response.status(422).send('');
    }

    // Fetch old verification
    const oldVerification = await VerificationToken.query()
      .select('id')
      .where('user_id', user.id)
      .where('type', 'password')
      .first();

    if (oldVerification) {
      return {key: oldVerification.payload};
    }


    // Generate key
    const payload = await Hash.make(crypto.randomBytes(20).toString('hex'));

    // Generate token
    const token = Math.floor(100000 + Math.random() * 900000);

    // Save verification in database
    await generateVerification(user.id, 'password', payload, true, token);

    // Send SMS

    await sendSMS(data.mobile, `Your password reset code from Khidmat is ${token}`);

    return {key: payload};
  }

  async profile({auth}) {
    const data = await Promise.all([
      db.select('payload', 'type', 'last_send', 'try', 'auto_delete')
        .from('verification_tokens')
        .whereIn('type', ['email', 'mobile'])
        .where('user_id', auth.id),
      User.query()
        .select('mobile', 'email', 'description', 'address', 'verified')
        .leftJoin('institutions', 'user_id', 'users.id')
        .where('users.id', auth.id)
        .first(),
    ]);

    const info = data[1].$attributes;


    if (!info.verified) {
      info.mobile = null;
    }
    delete info.verified;


    const response = {
      pending: {
        email: null,
        mobile: null,
      },
      info,
    };

    data[0].forEach(item => response.pending[item.type] = {
      value: item.payload,
      lastSend: item.last_send,
      maximumReached: item.try > 10 && item.auto_delete,
    });

    return response;
  }

  static async exists(column, value, type) {
    // If trying to check existence by email then it's presence is must
    // and email is an optional field in the registration form
    // if it's not here then user will be considered as not existed, and
    // when user will try to add his/her email in the dashboard, program will
    // check the email that time
    if (!value) {
      return false;
    }

    const count = await User.query()
      .where(column, value)
      .where('user_type_id', type)
      .count('id as total');

    return !!count[0].total;
  }
}

module.exports = UserController;
