'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class PositionsSchema extends Schema {
    up() {
        this.create('positions', (table) => {
            table.increments();
            table.string('name', 100);
            table.timestamps();
        });
    }

    down() {
        this.drop('positions');
    }
}

module.exports = PositionsSchema;
