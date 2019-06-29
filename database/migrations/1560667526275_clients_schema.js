'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClientsSchema extends Schema {
    up() {
        this.create('clients', (table) => {
            table.increments()
            table.string('name', 100)
            table.string('redirect_uri', 190)
            table.timestamps()
        })
    }

    down() {
        this.drop('clients')
    }
}

module.exports = ClientsSchema
