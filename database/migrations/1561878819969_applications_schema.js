'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ApplicationsSchema extends Schema {
    up() {
        this.create('applications', (table) => {
            table.increments()
            table.integer('job_id')
                .unsigned()
                .references('id')
                .inTable('jobs').notNullable()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.boolean('shortlist')
            table.timestamps()
        })
    }

    down() {
        this.drop('applications')
    }
}

module.exports = ApplicationsSchema
