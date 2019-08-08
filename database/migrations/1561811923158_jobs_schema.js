'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class JobsSchema extends Schema {
    up() {
        this.create('jobs', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.string('position')
            table.date('deadline')
            table.timestamps()
        })
    }

    down() {
        this.drop('jobs')
    }
}

module.exports = JobsSchema
