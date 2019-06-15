'use strict'

/*
|--------------------------------------------------------------------------
| ProductionSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const db = use('Database')

class ProductionSeeder {
    async run() {

        /**** Seed user_types ****/

        await db.from('user_types').insert([
            {
                name: 'employee'
            },
            {
                name: 'employer'
            }
        ])
    }
}

module.exports = ProductionSeeder
