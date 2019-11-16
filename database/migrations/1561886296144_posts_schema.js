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
            table.text('title', 'mediumtext');
            table.text('content', 'longtext');
            table.timestamps();
        });
    }

    down() {
        this.drop('posts');
    }
}

module.exports = PostsSchema;
