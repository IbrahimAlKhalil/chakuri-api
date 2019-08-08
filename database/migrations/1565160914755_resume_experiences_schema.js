'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResumeExperiencesSchema extends Schema {
    up() {
        this.create('resume_experiences', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.string('institute')
            table.string('designation', 60)
            table.string('address')
            table.date('start')
            table.date('end')
            table.boolean('current')
            table.text('responsibilities')
            table.timestamps()
        })
    }

    down() {
        this.drop('resume_experiences')
    }
}

module.exports = ResumeExperiencesSchema
