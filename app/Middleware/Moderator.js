'use strict';
/** @typedef {import('@adonisjs/framework/src/Request')} Request */

/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Moderator {
    /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Function} next
     */
    async handle({request, auth, response}, next, permissions) {

        if (!auth.authenticated) {
            return response.status(401).send('');
        }

        const user = await auth.user();

        if (user.type !== 3) {
            return response.status(401).send('');
        }


        if (!permissions) {
            return await next();
        }

        if (!user.permissions.includes('all')) {
            const notPermitted = permissions.some(permission => !user.permissions.includes(permission));

            if (notPermitted) {
                return response.status(401).send('');
            }
        }

        // call next to advance the request
        await next();
    }
}

module.exports = Moderator;
