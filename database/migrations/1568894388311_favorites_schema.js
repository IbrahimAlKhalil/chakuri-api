'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FavoritesSchema extends Schema {
    up() {
        this.create('favorites', (table) => {
            table.increments()
            table.integer('job_id')
                .unsigned()
                .references('id')
                .inTable('jobs').notNullable()
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable()
            table.timestamps()
        })
    }

    down() {
        this.drop('favorites')
    }
}

module.exports = FavoritesSchema
