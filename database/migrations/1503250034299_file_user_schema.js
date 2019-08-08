'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FileUserSchema extends Schema {
    up() {
        this.create('file_users', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.integer('file_id')
                .unsigned()
                .references('id')
                .inTable('files').notNullable()
            table.timestamps()
        })
    }

    down() {
        this.drop('file_users')
    }
}

module.exports = FileUserSchema
