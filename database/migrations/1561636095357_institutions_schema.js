'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InstitutionsSchema extends Schema {
    up() {
        this.create('institutions', (table) => {
            table.increments()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.integer('institution_type_id')
                .unsigned()
                .references('id')
                .inTable('institution_types')
            table.text('description')
            table.string('address')
            table.timestamps()
        })
    }

    down() {
        this.drop('institutions')
    }
}

module.exports = InstitutionsSchema
