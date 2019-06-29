'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */

/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const AuthManager = use('App/AuthManager')

class AuthInit {
    /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Function} next
     */
    async handle(ctx, next) {
        ctx.auth = new AuthManager(ctx)
        await ctx.auth.init()

        // call next to advance the request
        await next()
    }
}

module.exports = AuthInit
