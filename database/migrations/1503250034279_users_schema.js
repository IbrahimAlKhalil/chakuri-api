'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class UserSchema extends Schema {
    up() {
        this.create('users', (table) => {
            table.increments();
            table.integer('user_type_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('user_types');
            table.integer('photo')
                .unsigned()
                .references('id')
                .inTable('files')
                .onDelete('CASCADE');
            table.string('mobile', 15).notNullable();
            table.string('email', 190);
            table.string('password', 60).notNullable();
            table.boolean('verified')
                .default(false);
            table.boolean('disabled')
                .default(0);
            table.string('name', 190);
            table.timestamps();

            table.unique(['mobile', 'user_type_id', 'verified']);
            table.unique(['email', 'user_type_id']);
        });
    }

    down() {
        this.drop('users');
    }
}

module.exports = UserSchema;
