'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */

/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Institute {
    /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Function} next
     */
    async handle({request, auth, response}, next) {
        if (!auth.authenticated) {
            return response.status(401).send('')
        }

        const user = await auth.user(['user_type_id as type'])

        if (user.type !== 2) {
            return response.status(401).send('')
        }

        // call next to advance the request
        await next()
    }
}

module.exports = Institute
