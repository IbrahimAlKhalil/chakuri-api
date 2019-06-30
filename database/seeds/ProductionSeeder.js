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

class ProductionSeeder {
    async run() {

        /**** Seed user_types ****/

        await db.from('user_types').insert([
            {
                name: 'employee'
            },
            {
                name: 'institution'
            },
            {
                name: 'moderator'
            }
        ])

        /**** Insert clients ****/

        await db.from('clients').insert([
            {
                name: 'web'
            },
            {
                name: 'mobile'
            }
        ])

        /**** Insert roles ****/
        await db.from('roles').insert([
            {
                name: 'admin',
                display_name: 'Admin'
            },
            {
                name: 'moderator',
                display_name: 'Moderator'
            }
        ])

        /**** Insert institution types ****/
        await db.from('institution_types').insert([
            {
                name: 'governmental',
                display_name: 'সরকারি'
            },
            {
                name: 'non-governmental',
                display_name: 'বেসরকারি'
            }
        ])

        /*** Insert categories ***/

        await db.from('categories').insert([
            {
                name: 'masjid',
                display_name: 'মসজিদ'
            },
            {
                name: 'madrasa',
                display_name: 'মাদ্রাসা'
            }
        ])


        /**** Create admin account ****/
        const user = new User
        user.user_type_id = 3
        user.mobile = '01923615718'
        user.email = 'hm.ibrahimalkhalil@gmail.com'
        user.password = '12345678'
        await user.save()

        await db.from('role_user').insert([
            {
                user_id: user.id,
                role_id: 1
            }
        ])

        await db.from('permissions').insert([
            {
                name: 'all'
            }
        ])

        await db.from('role_permission').insert([
            {
                role_id: 1,
                permission_id: 1
            }
        ])

        await generateToken(user.id, true)
    }
}

module.exports = ProductionSeeder
