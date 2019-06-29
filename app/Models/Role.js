'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Role extends Model {
    users() {
        return this.belongsToMany('User')
    }
}

module.exports = Role
