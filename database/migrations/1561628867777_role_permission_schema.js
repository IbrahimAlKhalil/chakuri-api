'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class RolePermissionSchema extends Schema {
    up() {
        this.create('role_permission', (table) => {
            table.increments();
            table.integer('role_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('roles')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.integer('permission_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('permissions')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.timestamps();
        });
    }

    down() {
        this.drop('role_permission');
    }
}

module.exports = RolePermissionSchema;
