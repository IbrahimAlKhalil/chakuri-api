'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class SettingsSchema extends Schema {
    up() {
        this.create('settings', (table) => {
            table.increments();
            table.string('name');
            table.text('value', 'mediumtext');
            table.string('label');
            table.string('type');
            table.timestamps();
        });
    }

    down() {
        this.drop('settings');
    }
}

module.exports = SettingsSchema;
