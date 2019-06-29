'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThanasSchema extends Schema {
    up() {
        this.create('thanas', (table) => {
            table.increments()
            table.integer('districts_id')
                .unsigned()
                .references('id')
                .inTable('districts').notNullable()
            table.timestamps()
        })
    }

    down() {
        this.drop('thanas')
    }
}

module.exports = ThanasSchema
