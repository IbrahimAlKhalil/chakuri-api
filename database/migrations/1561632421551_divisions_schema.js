'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DivisionsSchema extends Schema {
    up() {
        this.create('divisions', (table) => {
            table.increments()
            table.string('name', 40)
            table.timestamps()
        })
    }

    down() {
        this.drop('divisions')
    }
}

module.exports = DivisionsSchema
