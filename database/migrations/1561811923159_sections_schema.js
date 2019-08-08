'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SectionsSchema extends Schema {
    up() {
        this.create('sections', (table) => {
            table.increments()
            table.integer('job_id')
                .unsigned()
                .references('id')
                .inTable('jobs').notNullable()
            table.string('title', 50)
            table.text('content', 'mediumtext')
            table.timestamps()
        })
    }

    down() {
        this.drop('sections')
    }
}

module.exports = SectionsSchema
