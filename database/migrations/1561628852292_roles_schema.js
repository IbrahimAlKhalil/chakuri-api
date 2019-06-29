'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RolesSchema extends Schema {
    up() {
        this.create('roles', (table) => {
            table.increments()
            table.string('name', 30)
            table.string('display_name', 30)
            table.string('description', 150)
            table.timestamps()
        })
    }

    down() {
        this.drop('roles')
    }
}

module.exports = RolesSchema
