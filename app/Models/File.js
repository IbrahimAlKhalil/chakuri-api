'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class File extends Model {
    fileUser() {
        return this.belongsTo('App/Models/FileUser')
    }
}

module.exports = File
