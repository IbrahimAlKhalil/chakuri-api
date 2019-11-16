'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class MenuSchema extends Schema {
    up() {
        this.create('menus', (table) => {
            table.increments();
            table.integer('menu_location_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('menu_locations');
            table.string('name');
            table.boolean('enabled').default(1);
            table.timestamps();
        });
    }

    down() {
        this.drop('menus');
    }
}

module.exports = MenuSchema;
