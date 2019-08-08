'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResumeTrainingsSchema extends Schema {
    up() {
        this.create('resume_trainings', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.string('title', 50)
            table.string('topics')
            table.string('institute')
            table.specificType('year', 'smallint')
            table.string('duration', 30)
            table.timestamps()
        })
    }

    down() {
        this.drop('resume_trainings')
    }
}

module.exports = ResumeTrainingsSchema
