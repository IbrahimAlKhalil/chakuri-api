'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class JobsSchema extends Schema {
    up() {
        this.create('jobs', (table) => {
            table.increments()
            table.integer('institution_id')
                .unsigned()
                .references('id')
                .inTable('institutions').notNullable()
            table.string('position')
            table.timestamps()
        })
    }

    down() {
        this.drop('jobs')
    }
}

module.exports = JobsSchema
