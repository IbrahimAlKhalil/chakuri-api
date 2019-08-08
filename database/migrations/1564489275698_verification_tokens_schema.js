'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VerificationTokensSchema extends Schema {
    up() {
        this.create('verification_tokens', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.string('type')
            table.text('payload', 'mediumtext')
            table.integer('try')
                .unsigned()
                .default(0)
            table.string('token')
            table.timestamps()
        })
    }

    down() {
        this.drop('verification_tokens')
    }
}

module.exports = VerificationTokensSchema
