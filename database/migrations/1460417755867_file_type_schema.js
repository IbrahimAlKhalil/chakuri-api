'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FileTypeSchema extends Schema {
    up() {
        this.create('file_types', (table) => {
            table.increments()
            table.string('name')
            table.timestamps()
        })
    }

    down() {
        this.drop('file_types')
    }
}

module.exports = FileTypeSchema
