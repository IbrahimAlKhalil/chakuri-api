'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class FileUserSchema extends Schema {
    up() {
        this.create('file_user', (table) => {
            table.increments();
            table.integer('user_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');
            table.integer('file_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('files')
                .onDelete('CASCADE');
            table.timestamps();
        });
    }

    down() {
        this.drop('file_user');
    }
}

module.exports = FileUserSchema;
