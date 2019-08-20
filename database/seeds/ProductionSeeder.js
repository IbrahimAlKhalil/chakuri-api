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

const generateToken = require('../../app/helpers').generateToken
/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const db = use('Database')
const User = use('App/Models/User')
const Env = use('Env')

class ProductionSeeder {
    async run() {

        await Promise.all([

            /**** Seed user_types ****/
            db.from('user_types').insert([
                {
                    name: 'employee'
                },
                {
                    name: 'institution'
                },
                {
                    name: 'moderator'
                }
            ]),

            /**** Insert clients ****/

            db.from('clients').insert([
                {
                    name: 'web'
                },
                {
                    name: 'mobile'
                }
            ]),

            /**** Insert roles ****/
            db.from('roles').insert([
                {
                    name: 'admin',
                    display_name: 'Admin',
                    priority: 1
                },
                {
                    name: 'moderator',
                    display_name: 'Moderator',
                    priority: 2
                },
                {
                    name: 'employee',
                    display_name: 'Employee',
                    priority: 3
                },
                {
                    name: 'institution',
                    display_name: 'Institution',
                    priority: 3
                }
            ]),


            /**** Insert institution types ****/
            db.from('institution_types').insert([
                {
                    name: 'governmental',
                    display_name: 'সরকারি'
                },
                {
                    name: 'non-governmental',
                    display_name: 'বেসরকারি'
                }
            ]),

            /*** Insert categories ***/

            db.from('categories').insert([
                {
                    name: 'masjid',
                    display_name: 'মসজিদ',
                    icon: 'fas fa-mosque'
                },
                {
                    name: 'madrasa',
                    display_name: 'মাদ্রাসা',
                    icon: 'fas fa-school'
                }
            ])
        ])


        /**** Create admin account ****/
        const user = new User
        user.user_type_id = 3
        user.mobile = '01923615718'
        user.email = 'hm.ibrahimalkhalil@gmail.com'
        user.password = '12345678'
        await user.save()

        await Promise.all([
            db.from('role_user').insert([
                {
                    user_id: user.id,
                    role_id: 1
                }
            ]),

            db.from('permissions').insert([
                {
                    name: 'all'
                }
            ]),

            generateToken(user.id, true)
        ])

        await db.from('role_permission').insert([
            {
                role_id: 1,
                permission_id: 1
            }
        ])


        // Insert places
        let divisions = require('./divisions')
        const districts = require('./districts')
        const thanas = require('./thanas')

        function clean(data) {
            data.forEach(data => {
                data.name = data.bn_name

                delete data.bn_name
            })
        }

        [divisions, districts, thanas].forEach(clean)

        await db.from('divisions').insert(divisions)
        await db.from('districts').insert(districts)
        await db.from('thanas').insert(thanas)


        // Add mysql event for deleting expired tokens


        await Promise.all([
            db.raw(
                `CREATE EVENT IF NOT EXISTS AutoDeleteExpiredTokens 
            ON SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 1 DAY 
            ON COMPLETION PRESERVE 
            DO 
            DELETE FROM ${Env.get('DB_DATABASE')}.tokens WHERE updated_at < DATE_SUB(NOW(), INTERVAL 5 HOUR)`
            ),

            db.raw(`
            CREATE EVENT IF NOT EXISTS AutoDeleteExpiredVerificationTokens 
            ON SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 1 HOUR 
            ON COMPLETION PRESERVE 
            DO 
            DELETE FROM ${Env.get('DB_DATABASE')}.verification_tokens WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `)
        ])
    }
}

module.exports = ProductionSeeder
