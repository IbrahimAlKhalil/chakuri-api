'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EmployeesSchema extends Schema {
    up() {
        this.create('employees', (table) => {
            table.increments()
        })
    }

    down() {
        this.drop('employees')
    }
}

module.exports = EmployeesSchema
