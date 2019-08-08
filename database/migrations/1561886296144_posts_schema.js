'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PostsSchema extends Schema {
    up() {
        this.create('posts', (table) => {
            table.increments()
            table.integer('moderator_id')
                .unsigned()
                .references('id')
                .inTable('moderators').notNullable()
            table.string('title')
            table.text('content', 'longtext')
            table.integer('image')
                .unsigned()
                .references('id')
                .inTable('files')
            table.timestamps()
        })
    }

    down() {
        this.drop('posts')
    }
}

module.exports = PostsSchema
