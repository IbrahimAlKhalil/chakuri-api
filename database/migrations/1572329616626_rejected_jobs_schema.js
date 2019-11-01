'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class RejectedJobsSchema extends Schema {
    up() {
        this.create('rejected_jobs', (table) => {
            table.increments();
            table.integer('job_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('jobs')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.text('message', 'mediumtext');
            table.timestamps();
        });
    }

    down() {
        this.drop('rejected_jobs');
    }
}

module.exports = RejectedJobsSchema;
