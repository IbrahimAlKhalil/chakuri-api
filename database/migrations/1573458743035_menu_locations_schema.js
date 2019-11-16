'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class MenuLocationsSchema extends Schema {
    up() {
        this.create('menu_locations', (table) => {
            table.increments();
            table.string('name');
            table.timestamps();
        });
    }

    down() {
        this.drop('menu_locations');
    }
}

module.exports = MenuLocationsSchema;
