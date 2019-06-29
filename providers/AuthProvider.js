'use strict'

const {ServiceProvider} = require('@adonisjs/fold')

class AuthProvider extends ServiceProvider {
    /**
     * Register namespaces to the IoC container
     *
     * @method register
     *
     * @return {void}
     */
    register() {
        //
    }

    /**
     * Attach context getter when all providers have
     * been registered
     *
     * @method boot
     *
     * @return {void}
     */
    boot() {
        /** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
        const Route = use('Route')

        /*** Registration authentication routes ***/

        // This route will handle the token exchange
        Route.post('/authenticate', async ({response, auth}) => {

            // Try to login
            // attempt method will return what login method returns
            // and login method returns the access token if credentials are ok
            // otherwise it will return false
            const jwt = await auth.attempt()

            if (!jwt) {

                // Login attempt isn't successful
                return response.status(422).send({error: 'invalid_request'})
            }

            // Provide access token
            return jwt
        }).middleware('guest')

        Route.get('/user', async ({auth}) => {
            return await auth.user()
        }).middleware('auth')
    }
}

module.exports = AuthProvider
