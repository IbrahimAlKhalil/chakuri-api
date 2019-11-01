'use strict';
/** @typedef {import('@adonisjs/framework/src/Request')} Request */

/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Verified {
    /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Function} next
     */
    async handle({request, auth, response}, next) {
        if (!auth.authenticated) {
            return response.status(401).send('');
        }

        const user = await auth.user(['u.verified']);

        if (!user.verified) {
            return response.status(401).send('');
        }

        // call next to advance the request
        await next();
    }
}

module.exports = Verified;
