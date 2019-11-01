'use strict';
/** @typedef {import('@adonisjs/framework/src/Request')} Request */

/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Guest {
    /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Function} next
     */
    async handle({request, auth, response}, next) {
        // call next to advance the request
        if (auth.authenticated) {
            return response.status(403).send('');
        }

        await next();
    }
}

module.exports = Guest;
