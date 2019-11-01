'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class JobsSchema extends Schema {
    up() {
        this.create('jobs', (table) => {
            table.increments();
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users').notNullable();
            table.integer('district_id')
                .unsigned()
                .references('id')
                .inTable('districts').notNullable();
            table.integer('thana_id')
                .unsigned()
                .references('id')
                .inTable('thanas').notNullable();
            table.integer('position_id')
                .unsigned()
                .references('id')
                .inTable('positions').notNullable();
            table.integer('vacancy')
                .unsigned()
                .default(1);
            table.text('responsibilities')
                .notNullable();
            table.text('additional');
            table.text('education');
            table.integer('age_from')
                .unsigned();
            table.integer('age_to')
                .unsigned();
            // table.text('additional_info')
            table.string('village').notNullable();
            table.integer('experience_from')
                .unsigned()
                .default(0);
            table.integer('experience_to')
                .unsigned()
                .default(0);
            table.tinyint('gender', 3)
                .default(1);
            table.boolean('approved')
                .default(false);
            table.boolean('rejected')
                .default(false);
            table.boolean('negotiable')
                .default(false);
            table.boolean('special')
                .default(false);
            table.tinyint('nature', 2)
                .default(1);
            table.integer('salary_from')
                .unsigned();
            table.integer('salary_to')
                .unsigned();
            table.date('deadline');
            table.timestamps();
        });
    }

    down() {
        this.drop('jobs');
    }
}

module.exports = JobsSchema;
