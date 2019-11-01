'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class NotificationsSchema extends Schema {
    up() {
        this.create('notifications', (table) => {
            table.increments();
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable();
            table.integer('pic')
                .unsigned()
                .references('id')
                .inTable('files');
            table.string('title');
            table.string('link');
            table.boolean('seen').default(false);
            table.string('message');
            table.timestamps();
        });
    }

    down() {
        this.drop('notifications');
    }
}

module.exports = NotificationsSchema;
