'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ModeratorsSchema extends Schema {
    up() {
        this.create('moderators', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.integer('photo')
                .unsigned()
                .references('id')
                .inTable('files').notNullable()
            table.timestamps()
        })
    }

    down() {
        this.drop('moderators')
    }
}

module.exports = ModeratorsSchema
