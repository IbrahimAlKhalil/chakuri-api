'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class PostsSchema extends Schema {
    up() {
        this.create('posts', (table) => {
            table.increments();
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable();
            table.string('title');
            table.text('content', 'longtext');
            table.integer('image')
                .unsigned()
                .references('id')
                .inTable('files');
            table.timestamps();
        });
    }

    down() {
        this.drop('posts');
    }
}

module.exports = PostsSchema;
