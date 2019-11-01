'use strict';

const {truncateMobile, sendSMS} = require('../../helpers');
const VerificationToken = use('App/Models/VerificationToken');
const User = use('App/Models/User');
const PasswordReset = use('App/Models/PasswordReset');
const Env = use('Env');
const Mail = use('Mail');
const Hash = use('Hash');
const Route = use('Route');
const {validate} = use('Validator');
const crypto = require('crypto');
const emailTemplate = require('../../../templates/email-verification');


const expired = {
    message: 'কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে',
    status: 'expired'
};


class VerificationController {
    async email({request, params, response}) {

        const token = params.token;
        const sorry = `
            <h1>Sorry this token is expired</h1>
            `;

        // Fetch token
        const verification = await VerificationToken.find(token.charAt(token.length - 1));

        // Check whether exists
        if (!verification) {
            return response.send(sorry);
        }

        // Match token
        if (verification.token !== token) {
            return response.send(sorry);
        }

        // Issued date
        const issued = new Date(verification.created_at.toString());
        const createdAgo = Date.now() - issued.getTime();

        // Token shouldn't be expired
        if (createdAgo >= Env.get('VERIFY_TOKEN_LIFETIME')) {
            return response.send(sorry);
        }

        // Delete token
        await verification.delete();


        // TODO: Check whether email is taken


        // Update user data
        await User.query()
            .update({email: verification.payload})
            .where('id', verification.user_id);

        return `
        <h1>Success!</h1>
        `;
    }

    async mobile({params, response, auth}) {
        const token = params.token;

        // TODO: Disable account if it isn't verified and tried more than 30 times

        // Fetch token
        const verification = await VerificationToken.query()
            .where('user_id', auth.id)
            .where('type', 'mobile')
            .first();

        // Check whether verification exists
        if (!verification) {
            return response.status(422).send(expired);
        }

        // Maximum tries reached
        if (verification.try >= 10 && verification.auto_delete) {
            return response.status(422).send({
                message: 'দুঃখিত আপনি দশ বারের বেশি ভুল কোড দিয়েছেন তাই আপনার অনুরোধটি বাতিল বলে গণ্য হয়েছে, দয়া করে ১ ঘন্টা পর আবার চেষ্টা করুন',
                status: 'wrong'
            });
        }

        // Match token
        if (verification.token !== token) {
            verification.try = verification.try + 1;
            await verification.save();

            return response.status(422).send({
                message: 'দুঃখিত কোডটি সঠিক নয়',
                status: 'wrong'
            });
        }


        // Issued date
        const issued = new Date(verification.updated_at.toString());
        const createdAgo = Date.now() - issued.getTime();

        // Token shouldn't be expired
        if (createdAgo >= Env.get('VERIFY_TOKEN_LIFETIME')) {
            return expired;
        }

        // Delete token
        await verification.delete();

        // Update user data
        await User.query()
            .update({mobile: truncateMobile(verification.payload), verified: true})
            .where('id', auth.id);

        return '';
    }

    async resendMobile({auth, response}) {
        // Fetch token
        const verification = await VerificationToken.query()
            .where('user_id', auth.id)
            .where('type', 'mobile')
            .first();

        if (!verification) {
            return response.status(422).send(expired.message);
        }

        // Maximum tries reached
        if (verification.try >= 10 && verification.auto_delete) {
            return response.status(422).send('');
        }

        // TODO: Disable account if maximum resend reached

        // Don't send more than one sms per two minutes
        if (Date.now() - verification.last_send.getTime() < 120000) {
            // Last sent less than two minutes ago

            return response.status(422).send('');
        }

        await sendSMS(verification.payload, `Your verification code from Khidmat is ${verification.token}`);

        verification.last_send = Date.now();
        await verification.save();
    }

    async resendEmail({auth, response, request}) {
        // TODO: Disable account if maximum resend reached

        // Fetch token
        const verification = await VerificationToken.query()
            .where('user_id', auth.id)
            .where('type', 'email')
            .first();

        if (!verification) {
            return response.status(422).send(expired.message);
        }

        if (Date.now() - verification.last_send.getTime() < 120000) {
            return response.status(422).send('');
        }

        // Send email
        await VerificationController.sendMail(verification.token, verification.payload, request);

        verification.last_send = Date.now();
        await verification.save();
    }

    async updatePayload({auth, response, request}) {
        const data = request.only(['type', 'payload']);

        const validation = await validate(data, {
            type: 'required|in:mobile,email',
            payload: 'required|' + data.type
        });

        if (validation.fails()) {
            return response.status(422).send('');
        }

        const verification = await VerificationToken.query()
            .where('user_id', auth.id)
            .where('type', data.type)
            .first();

        if (!verification) {
            return response.status(422).send('');
        }

        // Maximum tries reached
        if (data.type === 'mobile' && verification.try >= 10 && verification.auto_delete) {
            return response.status(422).send('');
        }

        switch (data.type) {
            case 'email':
                await VerificationController.sendMail(verification.token, data.payload, request);
                break;
            default:
                await sendSMS(data.payload, `Your verification code from Khidmat is ${verification.token}`);
        }

        verification.last_send = Date.now();
        verification.payload = data.payload;
        await verification.save();
    }

    static async sendMail(token, email, request) {
        const action = Route.url('email-verification', {token: token});

        // Send email
        const template = emailTemplate({
            company: 'Khidmat',
            message: 'Thanks for signing up! We\'re excited to have you as an user.',
            action: request.protocol() + '://' + request.header('host') + action,
            address: 'Kajla, Vangapress, Jatrabari, Dhaka 1236, Bangladesh'
        });

        try {
            await Mail.raw(template, message => {
                message.to(email);
                message.subject('Email verification');
            });
        } catch (e) {
        }
    }

    async password({request, response}) {
        const data = request.only(['type', 'mobile', 'key', 'token']);

        const validation = await validate(data, {
            type: 'required|in:1,2,3',
            mobile: 'required|mobile',
            key: 'required|string',
            token: 'required|integer'
        });

        // Validate request
        if (validation.fails()) {
            // Validation failed
            return response.status(422).send('');
        }


        // Fetch user by mobile
        const user = await User.query()
            .select('id', 'name', 'photo')
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
            .select('payload', 'token', 'id')
            .where('user_id', user.id)
            .where('type', 'password')
            .first();

        if (!oldVerification) {
            // User not found
            return response.status(422).send('');
        }

        // Verify token and key
        if (oldVerification.payload !== data.key || oldVerification.token !== data.token) {
            return response.status(422).send('দুঃখিত কোডটি সঠিক নয়');
        }


        // Delete verification
        await oldVerification.delete();


        const token = await Hash.make(crypto.randomBytes(20).toString('hex'));

        // Create onetime password reset token
        const reset = new PasswordReset;

        reset.token = await Hash.make(token);
        reset.user_id = user.id;
        await reset.save();

        return {user, token};
    }
}

module.exports = VerificationController;
