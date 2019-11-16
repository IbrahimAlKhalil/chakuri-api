'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class VillagesSchema extends Schema {
    up() {
        this.create('villages', (table) => {
            table.increments();
        });
    }

    down() {
        this.drop('villages');
    }
}

module.exports = VillagesSchema;
