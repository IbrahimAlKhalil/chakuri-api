'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class ActivitiesSchema extends Schema {
    up() {
        this.create('activities', (table) => {
            table.increments();
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable();
            table.string('name');
            table.string('payload');
            table.timestamps();
        });
    }

    down() {
        this.drop('activities');
    }
}

module.exports = ActivitiesSchema;
