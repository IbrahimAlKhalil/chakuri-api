'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResumeEducationsSchema extends Schema {
    up() {
        this.create('resume_educations', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.string('marhala', 30)
            table.string('result', 30)
            table.specificType('year', 'smallint')
            table.string('madrasa')
            table.timestamps()
        })
    }

    down() {
        this.drop('resume_educations')
    }
}

module.exports = ResumeEducationsSchema
