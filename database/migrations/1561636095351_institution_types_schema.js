'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InstitutionTypesSchema extends Schema {
    up() {
        this.create('institution_types', (table) => {
            table.increments()
            table.string('name', 50)
            table.string('display_name', 15)
            table.timestamps()
        })
    }

    down() {
        this.drop('institution_types')
    }
}

module.exports = InstitutionTypesSchema
