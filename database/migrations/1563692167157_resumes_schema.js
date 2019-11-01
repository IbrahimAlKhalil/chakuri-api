'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResumesSchema extends Schema {
    up() {
        this.create('resumes', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.string('father', 60)
            table.string('mother', 60)
            table.date('dob')
            table.string('mobile', 15)
            table.string('email', 190)
            table.string('gender', 20)
            table.string('marital_status', 20)
            table.string('nationality', 40)

            table.integer('district')
                .unsigned()
                .references('id')
                .inTable('districts')
            table.integer('thana')
                .unsigned()
                .references('id')
                .inTable('thanas')
            table.string('village')

            table.integer('present_district')
                .unsigned()
                .references('id')
                .inTable('districts')
            table.integer('present_thana')
                .unsigned()
                .references('id')
                .inTable('thanas')
            table.string('present_village')

            table.timestamps()
        })
    }

    down() {
        this.drop('resumes')
    }
}

module.exports = ResumesSchema
