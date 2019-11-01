'use strict';

/*
|--------------------------------------------------------------------------
| ProductionSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

const generateToken = require('../../app/helpers').generateToken;
/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory');

const db = use('Database');
const User = use('App/Models/User');
const Env = use('Env');

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
                    name: 'Admin',
                    writable: false
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
        ]);


        /****** Positions ******/
        await db.from('positions').insert([
            {
                category_id: 1,
                name: 'খতিব'
            },
            {
                category_id: 1,
                name: 'ইমাম'
            },
            {
                category_id: 1,
                name: 'মুয়াজ্জিন'
            },
            {
                category_id: 1,
                name: 'হাফেজ সাহেব (তারাবি)'
            },
            {
                category_id: 1,
                name: 'খাদেম'
            },
            {
                category_id: 2,
                name: 'কারি সাহেব'
            },
            {
                category_id: 2,
                name: 'শিক্ষক (হিফজ বিভাগ)'
            },
            {
                category_id: 2,
                name: 'শিক্ষক (হিফজ বিভাগ)'
            },
            {
                category_id: 2,
                name: 'হিসাব রক্ষক'
            },
            {
                category_id: 2,
                name: 'শিক্ষক (কিতাব বিভাগ)'
            },
            {
                category_id: 2,
                name: 'জেনারেল শিক্ষক'
            },
            {
                category_id: 2,
                name: 'শিক্ষক (ইফতা বিভাগ)'
            },
            {
                category_id: 2,
                name: 'নাজিমে তালিমাত'
            },
        ]);


        /**** Create admin account ****/
        const user = new User;
        user.user_type_id = 3;
        user.name = 'Ibrahim Al Khalil';
        user.mobile = '01923615718';
        user.email = 'hm.ibrahimalkhalil@gmail.com';
        user.password = '12345678';
        await user.save();

        await Promise.all([
            db.from('role_user').insert([
                {
                    user_id: user.id,
                    role_id: 1
                }
            ]),

            db.from('permissions').insert([
                {
                    name: 'all',
                    display_name: 'All'
                },
                {
                    name: 'job-requests',
                    display_name: 'Review And Approve/Reject Job Request'
                },
                {
                    name: 'moderators',
                    display_name: 'Add/Modify Moderators'
                },
                {
                    name: 'roles',
                    display_name: 'Add/Modify Roles'
                },
                {
                    name: 'posts',
                    display_name: 'Creating Posts/Pages'
                },
                {
                    name: 'menu',
                    display_name: 'Add/Modify Menu Items'
                },
                {
                    name: 'categories',
                    display_name: 'Add/Modify Job Categories And Positions'
                },
                {
                    name: 'geolocation',
                    display_name: 'Add/Modify Geolocation'
                },
                {
                    name: 'settings',
                    display_name: 'Modify Application\'s Settings'
                },
                {
                    name: 'files',
                    display_name: 'Upload/Delete Files'
                },
                {
                    name: 'institution-types',
                    display_name: 'Add/Modify Institution Types'
                }
            ]),

            generateToken(user.id, true),

            db.from('file_types').insert([
                {
                    name: 'profile_pic',
                },
                {
                    name: 'resume'
                },
                {
                    name: 'post'
                }
            ])
        ]);

        await db.from('role_permission').insert([
            {
                role_id: 1,
                permission_id: 1
            }
        ]);


        // Insert places
        let divisions = require('./divisions');
        const districts = require('./districts');
        const thanas = require('./thanas');

        function clean(data) {
            data.forEach(data => {
                data.name = data.bn_name;

                delete data.bn_name;
            });
        }

        [divisions, districts, thanas].forEach(clean);

        await db.from('divisions').insert(divisions);
        await db.from('districts').insert(districts);
        await db.from('thanas').insert(thanas);

        // Enable event scheduler

        await db.raw(`SET GLOBAL event_scheduler = ON;`);


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
            DELETE FROM ${Env.get('DB_DATABASE')}.verification_tokens WHERE auto_delete = 1 and created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `)
        ]);
    }
}

module.exports = ProductionSeeder;
