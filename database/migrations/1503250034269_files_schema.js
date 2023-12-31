'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class FilesSchema extends Schema {
    up() {
        this.create('files', (table) => {
            table.increments();
            table.integer('file_type_id')
                .unsigned()
                .references('id')
                .inTable('file_types')
                .onDelete('CASCADE');
            table.text('name', 'mediumtext');
            table.string('mime_type', 50);
            table.timestamps();
        });
    }

    down() {
        this.drop('files');
    }
}

module.exports = FilesSchema;
