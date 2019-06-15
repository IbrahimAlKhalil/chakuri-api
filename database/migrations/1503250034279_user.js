'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
    up() {
        this.create('users', (table) => {
            table.increments()
            table.integer('user_type_id')
                .unsigned()
                .references('id')
                .inTable('user_types')
            table.string('mobile', 15).notNullable()
            table.string('email', 190)
            table.string('password', 60).notNullable()
            table.string('token', 120).unique()
            table.string('name', 60)
            table.date('dob')
            table.timestamps()

            table.unique(['mobile', 'user_type_id'])
            table.unique(['email', 'user_type_id'])
        })
    }

    down() {
        this.drop('users')
    }
}

module.exports = UserSchema
