'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RolePermissionSchema extends Schema {
    up() {
        this.create('role_permission', (table) => {
            table.increments()
            table.integer('role_id')
                .unsigned()
                .references('id')
                .inTable('roles')
                .notNullable()
            table.integer('permission_id')
                .unsigned()
                .references('id')
                .inTable('permissions')
                .notNullable()
            table.timestamps()
        })
    }

    down() {
        this.drop('role_permission')
    }
}

module.exports = RolePermissionSchema
