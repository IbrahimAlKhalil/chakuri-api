'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VillagesSchema extends Schema {
    up() {
        this.create('villages', (table) => {
            table.increments()
            table.integer('thana_id')
                .unsigned()
                .references('id')
                .inTable('thanas').notNullable()
        })
    }

    down() {
        this.drop('villages')
    }
}

module.exports = VillagesSchema
