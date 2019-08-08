'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Resume extends Model {
    user() {
        return this.belongsTo('App/Models/User')
    }

    photo() {
        return this.belongsTo('App/Models/File', 'id', 'photo')
    }
}

module.exports = Resume
