const User = use('App/Models/User')
const db = use('Database')
const Token = use('App/Models/Token')
const Hash = use('Hash')
const Env = use('Env')
const Encryption = use('Encryption')
const {validate} = use('Validator')

const jwt = require('jsonwebtoken')

const {truncateMobile, generateToken, formatJwt} = require('./helpers')

const tokenLifetime = Env.get('TOKEN_LIFETIME', 3600000)

class AuthManager {
    constructor({request, response}) {
        this.request = request
        this.response = response
        this.id = null
        this.token = null
        // Cache the user model
        this.cache = null
        this.authenticated = false
    }

    async init() {
        let givenToken = this.request.header('authorization')

        if (!givenToken) {
            return
        }

        const split = givenToken.split(' ')

        // Check existence
        // of the token
        if (split[0] === 'Bearer') {
            // Token exists
            // Verify token
            const auth = await AuthManager.auth(null, split[1])
            const jwt = auth.jwt

            if (jwt) {
                // Token verified.
                this.authenticated = true

                if (jwt.access_token !== split[1]) {
                    // Token refreshed

                    this.response.header('X-refresh-token', jwt.access_token)
                }

                this.id = auth.userId
                this.token = jwt.access_token
            }

            // Token isn't verified
            // if it's a protected route then auth
            // middleware will take care of the rest
        }
    }

    async attempt() {
        const request = this.request
        const username = request.input('username')

        // Validate username's existence in the request manually because isMobile will
        // use the username before even validated by adonis validation
        if (!username) {
            return false
        }


        const validation = await validate(request.all(), {
            password: 'required|min:8',
            user_type_id: 'required|in:1,2,3',
            // Check whether username is mobile or email
            // if it's mobile then validate it with mobile's validation rule,
            // otherwise email's validation rule
            username: AuthManager.isMobile(username) ? 'required|min:11|max:14' : 'required|email',
            grant_type: 'in:password',
            client_id: 'exists:clients,id'
        })

        if (validation.fails()) {
            // Validation failed
            return false
        }

        // Pass the credentials to the login method
        // It'll verify the credentials and return
        // the access token if everything is fine
        return await this.login(username, request.input('password'), request.input('user_type_id'))
    }

    async login(username, password, userTypeId, checkCredentials = true, userId) {
        /** Why check checkCredentials and userId params?
         *
         *  The UserController's register method also calls this method when
         * registration is done, and at this stage, there is no need to
         * check user credentials.
         *
         * userId is needed to generate access token, if this login is
         * happening after the registration then we already have the userId,
         * so the UserController's register method will call this method
         * with the userId and checkCredentials = false
         */

        if (checkCredentials) {
            let tempId = await AuthManager.checkCredentials(username, password, userTypeId)
            if (tempId) userId = tempId
            else return false
        }

        const auth = await AuthManager.auth(userId, null, !checkCredentials)

        this.id = userId
        this.token = auth.jwt.access_token
        this.authenticated = true

        return auth.jwt
    }

    async user(cols = []) {
        if (!this.authenticated) {
            return null
        }

        const columns = ['u.name', 'u.email', 'u.mobile', 'u.user_type_id as type', 'f.path as photo', ...cols]

        if (!this.cache) {
            this.cache = await db.table('users as u')
                .select(columns)
                .leftJoin('files as f', 'f.id', 'u.photo')
                .where('u.id', this.id)
                .first()
        }

        return this.cache
    }

    static async checkCredentials(username, password, userTypeId) {
        const user = await User.query()
            .where('user_type_id', userTypeId)
            // Users can login with both mobile and email
            // so we must check what is it, and search in the right column
            .where(AuthManager.isMobile(username) ? 'mobile' : 'email', truncateMobile(username))
            .select('id', 'password')
            .first()

        if (!user) {
            // No user found
            return false
        }

        // Verify password
        if (await Hash.verify(password, user.password)) {
            // Ok
            return user.id
        }

        // Password mismatch
        return false
    }

    static async auth(userId, token, newUser) {
        // Check whether the user already has a token alive


        if (token) {
            // Token is given
            // Verify signature
            try {
                const decoded = jwt.verify(token, Env.get('APP_KEY'))

                // check it's existence in the database

                const tokenInDb = await Token.find(decoded.keyid)

                // check what if the id is correct
                if (!tokenInDb) {
                    return false
                }

                // Token in database and the token given are not same

                if (Encryption.decrypt(tokenInDb.key) !== token) {
                    return false
                }

                // Check life/expiration time of the token
                const issued = new Date(tokenInDb.updated_at.toString())

                const createdAgo = Date.now() - issued.getTime()

                if (createdAgo >= Env.get('TOKEN_EXPIRATION', 18000000)) {
                    // Token is expired
                    // Remove the token from database
                    await Token.query()
                        .where('id', tokenInDb.id)
                        .delete()

                    return false
                }

                if (createdAgo >= tokenLifetime) {
                    // Token is dead issue a new one if there is none alive

                    return formatJwt(tokenInDb.user_id, await generateToken(tokenInDb.user_id))
                }

                return formatJwt(tokenInDb.user_id, token)

            } catch (e) {
                return false
            }
        }

        // The user didn't send any token
        // generate a new one and return

        return formatJwt(userId, await generateToken(userId, newUser))

    }

    static isMobile(username) {
        return /^(\+?88)?01\d{9}$/.test(username)
    }
}

module.exports = AuthManager
