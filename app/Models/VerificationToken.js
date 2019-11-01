'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class VerificationToken extends Model {
    static get dates() {
        return super.dates.concat(['last_send'])
    }
}

module.exports = VerificationToken
