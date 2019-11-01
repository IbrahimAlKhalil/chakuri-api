'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class JobRequestsSchema extends Schema {
    up() {
        this.create('job_requests', (table) => {
            table.increments();
            table.integer('job_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('jobs')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.integer('moderator')
                .unsigned()
                .references('id')
                .inTable('users').notNullable();
            table.timestamps();
        });
    }

    down() {
        this.drop('job_requests');
    }
}

module.exports = JobRequestsSchema;
