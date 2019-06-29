'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DistrictsSchema extends Schema {
    up() {
        this.create('districts', (table) => {
            table.increments()
            table.integer('division_id')
                .unsigned()
                .references('id')
                .inTable('divisions').notNullable()
            table.string('name')
            table.timestamps()
        })
    }

    down() {
        this.drop('districts')
    }
}

module.exports = DistrictsSchema
