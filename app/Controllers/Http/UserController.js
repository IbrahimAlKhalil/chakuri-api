'use strict'

const User = use('App/Models/User')
const File = use('App/Models/File')
const Helpers = use('Helpers')
const Drive = use('Drive')
const db = use('Database')
const VerificationToken = use('App/Models/VerificationToken')
const Resume = use('App/Models/Resume')
const crypto = require('crypto')
const {validate} = use('Validator')
const Hash = use('Hash')
const Env = use('Env')
const Route = use('Route')
const Mail = use('Mail')
const emailTemplate = require('../../../templates/email-verification')
const {truncateMobile} = require('../../helpers')

class UserController {

    async register({request, response, auth}) {

        // Validate only password, name. Other inputs will be validated by userExists method
        const validation = await validate(request.only(['password', 'name']), {
            password: 'required|min:8',
            name: 'required|string|max:190'
        })


        // Validate password and name
        // mobile, user_type_id and email will be validated by userExists method
        if (validation.fails() || await this.userExists({request}, true)) {
            return response.status(422).send('')
        }

        // Create user
        const user = await User.create(
            request.only(['user_type_id', 'mobile', 'email', 'password', 'name'])
        )

        const type = Number(request.input('user_type_id'))

        // Create a resume for employee
        if (type === 1) {
            await Resume.create({
                user_id: user.id,
                name: user.name,
                mobile: user.mobile,
                email: user.email
            })
        } else if (type === 2) {
            await db.table('institutions')
                .insert({user_id: user.id})
        }

        // Give the user a role
        await db.table('role_user').insert({
            role_id: type === 1 ? 3 : 4,
            user_id: user.id
        })

        // Attempt to login
        return await auth.login(
            user.mobile,
            request.input('password'),
            user.user_type_id,
            false,
            user.id
        )
    }

    async userExists({request, response}, register = false) {

        const validation = await validate(
            request.only(['user_type_id', 'mobile', 'email']), {
                user_type_id: 'required|in:1,2' + (!register ? ',3' : ''),
                mobile: 'required|mobile',
                email: 'email'
            })

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
                return response.status(422).send('')
            }

            return true
        }

        const existsByMobile = await UserController.exists('mobile', request)

        // Check user's existence by email, though it's optional field in the registration form
        // exists method will check whether it's present in the request
        const existsByEmail = await UserController.exists('email', request)

        return existsByMobile || existsByEmail
    }

    async userExistsByEmail({request, response}) {
        const validation = await validate(
            request.only(['user_type_id', 'email']), {
                user_type_id: 'required|in:1,2',
                email: 'email'
            })

        if (validation.fails()) {

            if (response) {
                return response.status(422).send('')
            }

            return true
        }

        return await UserController.exists('email', request)
    }

    async updateName({request, auth, response}) {
        const validation = await validate(request.only(['name']), {
            name: 'required|max: 190'
        })

        if (validation.fails()) {
            return response.status(422).send('')
        }

        await User.query()
            .update({name: request.input('name')})
            .where('id', auth.id)

        return ''
    }

    async updateEmail({request, auth, response}) {
        const validation = await validate(request.only(['email', 'password']), {
            email: 'required|email',
            password: 'required|min:8'
        })

        // Validate user input
        if (validation.fails()) {
            return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন')
        }

        const email = request.input('email')

        const oldToken = await db.raw(`
          select payload, type
          from verification_tokens
          where user_id = ?
            and created_at >= date_sub(NOW(), interval 1 hour)
            and type = 'email'
        `, [auth.id])

        // User should request twice
        if (oldToken[0].length > 0) {
            return response.status(422).send('')
        }

        // Fetch user instance
        const user = await User.query()
            .select('password', 'email')
            .where('id', auth.id)
            .first()

        // Check whether user exists
        if (!user) {
            return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন')
        }

        // New and previous email should be different
        if (user.email === email) {
            return response.status(422).send('')
        }

        // Verify password
        const verified = await Hash.verify(request.input('password'), user.password)

        // exit if password is not correct
        if (!verified) {
            return response.status(422).send('দুঃখিত, পাসওয়ার্ডটি সঠিক নয় ')
        }


        // Create verification token
        const verification = new VerificationToken
        verification.user_id = auth.id
        verification.type = 'email'
        verification.payload = email
        await verification.save()

        verification.token = crypto.randomBytes(20).toString('hex') + 1/*verification.id*/
        await verification.save()

        const action = Route.url('email-verification', {
            token: verification.token
        })

        // Send email
        const template = emailTemplate({
            company: 'Bahech',
            message: 'Thanks for signing up! We\'re excited to have you as an early user.',
            action: request.protocol() + '://' + request.header('host') + action,
            address: 'Kajla, Vangapress, Jatrabari, Dhaka 1236, Bangladesh'
        })

        await Mail.raw(template, message => {
            message.to(email)
            message.subject('Email verification')
        })

        return ''
    }

    async verifyEmail({params, response}) {
        const token = params.token
        const sorry = `
            <h1>Sorry this token is expired</h1>
            `

        // Fetch token
        const verified = await VerificationToken.query()
            .where('id', token.charAt(token.length - 1))
            .first()

        // Check whether exists
        if (!verified) {
            return response.send(sorry)
        }

        // Match token
        if (verified.token !== token) {
            return response.send(sorry)
        }

        // Issued date
        const issued = new Date(verified.updated_at.toString())
        const createdAgo = Date.now() - issued.getTime()

        // Token cannot be expired
        if (createdAgo >= Env.get('VERIFY_TOKEN_LIFETIME')) {
            return response.send(sorry)
        }

        // Delete token
        await verified.delete()

        // Update user data
        await User.query()
            .update({
                email: verified.payload
            })
            .where('id', verified.user_id)

        return `
        <h1>Success!</h1>
        `
    }

    async getEmailAndMobile({request, auth}) {
        const pending = await db.raw(`
          select payload, type
          from verification_tokens
          where (user_id = ? and created_at >= date_sub(NOW(), interval 1 hour))
            and (type = 'email' or type = 'mobile')
        `, [auth.id])

        const data = {
            email: [],
            mobile: []
        }

        pending[0].forEach(item => {
            data[item.type].push({
                value: item.payload,
                verified: false
            })
        })

        return data
    }

    async updateMobile({request, auth, response}) {
        const validation = await validate(request.only(['mobile', 'password']), {
            mobile: 'required|mobile',
            password: 'required|min:8'
        })

        // Validate user input
        if (validation.fails()) {
            return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন')
        }

        const mobile = request.input('mobile')

        const oldToken = await db.raw(`
          select payload, type
          from verification_tokens
          where user_id = ?
            and created_at >= date_sub(NOW(), interval 1 hour)
            and type = 'mobile'
        `, [auth.id])

        // User should not request twice
        if (oldToken[0].length > 0) {
            return response.status(422).send('')
        }

        // Fetch user instance
        const user = await User.query()
            .select('password', 'mobile')
            .where('id', auth.id)
            .first()

        // Check whether user exists
        if (!user) {
            return response.status(422).send('দুঃখিত, কিছু ভুল হয়েছে দয়া করে আবার চেষ্টা করুন')
        }

        // New and previous email should be different
        if (user.mobile === mobile) {
            return response.status(422).send('')
        }

        // Verify password
        const verified = await Hash.verify(request.input('password'), user.password)

        // exit if password is not correct
        if (!verified) {
            return response.status(422).send('দুঃখিত, পাসওয়ার্ডটি সঠিক নয় ')
        }


        // Create verification token
        const verification = new VerificationToken
        verification.user_id = auth.id
        verification.type = 'mobile'
        verification.payload = mobile
        await verification.save()

        verification.token = Math.floor(100000 + Math.random() * 900000)
        await verification.save()


        // Send message

        return ''
    }

    async verifyMobile({params, response, auth}) {
        const token = params.token

        // Fetch token
        const verified = await VerificationToken.query()
            .where('user_id', auth.id)
            .where('type', 'mobile')
            .first()

        // Check whether exists
        if (!verified) {
            return response.status(422).send({
                message: 'কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে',
                status: 'expired'
            })
        }

        if (verified.try > 5) {
            return response.status(422).send({
                message: 'দুঃখিত, আপনি পাঁচ বারের বেশি ভুল কোড দিয়েছেন। আপনার অনুরোধটি বাতিল বলে গণ্য হয়েছে, অনুগ্রহ করে  ১ ঘন্টা পর আবার চেষ্টা করুন ',
                status: 'maximum-reached'
            })
        }


        // Match token
        if (verified.token !== token) {
            verified.try = verified.try + 1
            await verified.save()

            return response.status(422).send({
                message: `দুঃখিত কোডটি সঠিক নয়। পাঁচ বারের বেশি ভুল কোড দিলে অনুরোধটি বাতিল বলে গণ্য হবে, এবং এক ঘন্টার আগে মোবাইল নাম্বার পরিবর্তন করতে পারবেন না`,
                status: 'wrong'
            })
        }


        // Issued date
        const issued = new Date(verified.updated_at.toString())
        const createdAgo = Date.now() - issued.getTime()

        // Token cannot be expired
        if (createdAgo >= Env.get('VERIFY_TOKEN_LIFETIME')) {
            return expired
        }

        // Delete token
        await verified.delete()

        // Update user data
        await User.query()
            .update({
                mobile: truncateMobile(verified.payload)
            })
            .where('id', auth.id)

        return ''
    }

    async updatePassword({request, auth, response}) {
        const validation = await validate(request.only(['pass']), {
            pass: 'required|min:8'
        })

        // Validate new password
        if (validation.fails()) {
            return response.status(422).send('সর্বনিম্ন আটটি অক্ষর হতে হবে')
        }

        // Fetch user instance
        const user = await User.query()
            .select('password')
            .where('id', auth.id)
            .first()


        // Verify old password
        const verified = await Hash.verify(request.input('password'), user.password)

        // Validate new password
        if (!verified) {
            return response.status(422).send('দুঃখিত, পাসওয়ার্ডটি সঠিক নয়')
        }


        await User.query()
            .update({password: request.input('pass')})
            .where('id', auth.id)

        return ''
    }

    async updatePhoto({request, auth, response}) {
        const photo = await request.file('photo')

        const validation = await validate({photo}, {
            photo: 'required|file|file_types:image'
        })

        // Photo should be included
        if (validation.fails()) {
            return response.status(422).send('')
        }


        // Validate extensions
        const ext = ['png', 'jpg', 'jpeg']
        if (!ext.includes(photo.subtype)) {
            return response.status(422).send('Sorry! only png and jpeg format supported')
        }

        // Validate size
        if (photo.size > 1e+6) {
            return response.status(422).send('দুঃখিত! ছবি ১ মেগাবাইট এর চেয়ে বড় হতে পারবে না')
        }

        const name = `${new Date().getTime()}.${photo.subtype}`
        await photo.move(Helpers.publicPath(`files/${auth.id}`), {name})

        const file = new File
        file.name = name
        file.mime_type = photo.headers['content-type']
        await file.save()

        const oldFile = await db.table('users as u')
            .select('f.id', 'f.name as name')
            .join('files as f', 'f.id', 'u.photo')
            .where('u.id', auth.id)
            .first()


        await Promise.all([
            db.table('file_user')
                .insert({
                    user_id: auth.id,
                    file_id: file.id
                }),
            db.table('users')
                .update({
                    photo: file.id
                })
        ])

        // Delete previous file
        if (oldFile) {
            await Promise.all([
                db.table('files')
                    .where('id', oldFile.id)
                    .delete(),

                Drive.delete(`files/${auth.id}/${oldFile.name}`)
            ])
        }


        return ''
    }

    async updateDescription({request, auth, response}) {
        const validation = await validate({photo}, {
            photo: 'required|file|file_types:image'
        })

        // Photo should be included
        if (validation.fails()) {
            return response.status(422).send('')
        }
    }

    async updateAddress({request, auth, response}) {

    }

    static async exists(column, request) {
        // If trying to check existence by email then it's presence is must
        // and email is an optional field in the registration form
        // if it's not here then user will be considered as not existed, and
        // when user will try to add his/her email in the dashboard, program will
        // check the email that time
        if (!request.input(column)) {
            return false
        }

        const count = await User.query()
            .where(column, request.input(column))
            .where('user_type_id', request.input('user_type_id'))
            .count('id as total')

        return !!count[0].total
    }
}

module.exports = UserController
