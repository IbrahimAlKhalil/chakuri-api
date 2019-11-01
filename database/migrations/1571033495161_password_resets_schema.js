'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class PasswordResetsSchema extends Schema {
    up() {
        this.create('password_resets', (table) => {
            table.increments();
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable();
            table.string('token');
            table.timestamps();
        });
    }

    down() {
        this.drop('password_resets');
    }
}

module.exports = PasswordResetsSchema;
