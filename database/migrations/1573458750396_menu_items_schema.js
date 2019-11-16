'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class MenuItemsSchema extends Schema {
    up() {
        this.create('menu_items', (table) => {
            table.increments();
            table.integer('menu_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('menus')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.integer('order')
                .unsigned();
            table.string('type');
            table.string('label');
            table.string('link');
            table.timestamps();
        });
    }

    down() {
        // this.drop('menu_items');
    }
}

module.exports = MenuItemsSchema;
