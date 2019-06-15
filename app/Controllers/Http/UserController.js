'use strict'

const User = use('App/Models/User')
const Hash = use('Hash')
const {validate} = use('Validator')
const {generateToken, truncateMobile} = require('../../helpers')

class UserController {
    constructor() {
        this.loginValidationRules = {
            user_type_id: 'required|in:1,2',
            mobile: 'required|min:11|max:14',
            email: 'email'
        }

        this.passwordRule = 'required|min:8'
    }

    async register({request, response}) {

        const validation = await validate(request.only(['password', 'name']), {
            password: this.passwordRule,
            name: 'required'
        })


        // Validate password and name
        // mobile, user_type_id and email will be validated by userExists method
        if (validation.fails() || await this.userExists({request, response})) {
            response.status(422)
            return ''
        }

        // Create user
        const user = await User.create(
            request.only(['user_type_id', 'mobile', 'email', 'password', 'name'])
        )

        // Save api token
        user.token = generateToken(user.id)
        await user.save()
    }

    async userExists({request, response}) {

        const validation = await validate(
            request.only(['user_type_id', 'mobile', 'email']),
            this.loginValidationRules
        )

        // If validation fails response with 422 status
        // If the status is 422 then the client must think that the data is invalid
        // If status is 200 then the client must look at the response
        if (validation.fails()) {
            response.status(422)
            // The register method also uses this method to
            // check user availability, and that is why the register
            // method doesn't validate user_type_id, mobile, email
            // so if validation fails then return true and register
            // method will response with status 422
            return true
        }

        const existsByMobile = await this.exists('mobile', request)
        const existsByEmail = await this.exists('email', request)

        return existsByMobile || existsByEmail
    }

    async exists(column, request) {
        // Email is optional that is why we've to check if it exists
        if (!request.input(column)) {
            return Promise.resolve(false)
        }

        const count = await User.query()
            .where(column, request.input(column))
            .where('user_type_id', request.input('user_type_id'))
            .count('id as total')

        return Promise.resolve(!!count[0].total)
    }

    async login({request, response}) {
        const username = request.input('username')

        if (!username) {
            response.status(422)
            return ''
        }

        const isMobile = /^(\+?88)?01\d{9}$/.test(username)
        const rules = {
            password: this.passwordRule,
            user_type_id: this.loginValidationRules.user_type_id,
            username: isMobile ? this.loginValidationRules.mobile : 'required|email'
        }

        const validation = await validate(
            request.only(['username', 'password', 'user_type_id']),
            rules
        )

        if (validation.fails()) {
            response.status(422)
            return ''
        }

        const user = await User.query()
            .where('user_type_id', request.input('user_type_id'))
            .where(isMobile ? 'mobile' : 'email', truncateMobile(username))
            .select('token', 'password')
            .first()

        if (!user) {
            return false
        }

        if (await Hash.verify(request.input('password'), user.password)) {
            return user.token
        }

        return false
    }
}

module.exports = UserController
