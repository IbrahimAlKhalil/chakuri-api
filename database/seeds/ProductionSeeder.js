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
          name: 'employee',
        },
        {
          name: 'institution',
        },
        {
          name: 'moderator',
        },
      ]),

      /**** Insert clients ****/

      db.from('clients').insert([
        {
          name: 'web',
        },
        {
          name: 'mobile',
        },
      ]),

      /**** Insert roles ****/
      db.from('roles').insert([
        {
          name: 'Admin',
          writable: false,
        },
      ]),


      /**** Insert institution types ****/
      db.from('institution_types').insert([
        {
          name: 'সরকারি',
        },
        {
          name: 'বেসরকারি',
        },
      ]),

      /*** Insert categories ***/

      db.from('categories').insert([
        {
          name: 'মসজিদ',
          icon: 'fas fa-mosque',
        },
        {
          name: 'মাদ্রাসা',
          icon: 'fas fa-school',
        },
      ]),
    ]);


    /****** Positions ******/
    await db.from('positions').insert([
      {
        name: 'খতিব',
      },
      {
        name: 'ইমাম',
      },
      {
        name: 'মুয়াজ্জিন',
      },
      {
        name: 'হাফেজ সাহেব (তারাবি)',
      },
      {
        name: 'খাদেম',
      },
      {
        name: 'কারি সাহেব',
      },
      {
        name: 'শিক্ষক (হিফজ বিভাগ)',
      },
      {
        name: 'হিসাব রক্ষক',
      },
      {
        name: 'শিক্ষক (কিতাব বিভাগ)',
      },
      {
        name: 'জেনারেল শিক্ষক',
      },
      {
        name: 'শিক্ষক (ইফতা বিভাগ)',
      },
      {
        name: 'নাজিমে তালিমাত',
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
          role_id: 1,
        },
      ]),

      db.from('permissions').insert([
        {
          name: 'all',
          display_name: 'All',
        },
        {
          name: 'job-requests',
          display_name: 'Review And Approve/Reject Job Request',
        },
        {
          name: 'moderators',
          display_name: 'Add/Modify Moderators',
        },
        {
          name: 'roles',
          display_name: 'Add/Modify Roles',
        },
        {
          name: 'pages',
          display_name: 'Create/Update Pages',
        },
        {
          name: 'menu',
          display_name: 'Add/Modify Menu Items',
        },
        {
          name: 'categories',
          display_name: 'Add/Modify Institute Categories',
        },
        {
          name: 'geolocation',
          display_name: 'Add/Modify Geolocation',
        },
        {
          name: 'settings',
          display_name: 'Modify Application\'s Settings',
        },
        {
          name: 'institute-types',
          display_name: 'Add/Modify Institution Types',
        },
        {
          name: 'categories',
          display_name: 'Add/Modify Institute Categories',
        },
        {
          name: 'positions',
          display_name: 'Add/Modify Job Positions (Designation)',
        },
        {
          name: 'users',
          display_name: 'Manage Users',
        },
      ]),

      generateToken(user.id, true),

      db.from('file_types').insert([
        {
          name: 'profile_pic',
        },
        {
          name: 'resume',
        },
        {
          name: 'post',
        },
        {
          name: 'logo',
        },
        {
          name: 'other',
        },
      ]),
    ]);

    await db.from('role_permission').insert([
      {
        role_id: 1,
        permission_id: 1,
      },
    ]);


    await db.from('menu_locations')
      .insert([
        {
          name: 'header',
        },
        {
          name: 'footer-1',
        },
        {
          name: 'footer-2',
        },
      ]);


    await Promise.all([
      db.from('files')
        .insert([
          {
            name: 'settings/logo.svg',
            file_type_id: 4,
            mime_type: 'image/svg+xml',
          }, {
            name: 'settings/banner.jpg',
            file_type_id: 5,
            mime_type: 'image/jpeg',
          },
        ]),
      db.from('settings')
        .insert([
          {
            name: 'title',
            label: 'Title',
            type: 'text',
            value: 'KhidmatBD',
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            value: 'KhidmatBD',
          },
          {
            name: 'copyright',
            label: 'Copyright',
            type: 'text',
            value: '© Copyright KhidmatBD all rights reserved',
          },
          {
            name: 'logo',
            label: 'Logo',
            type: 'image',
            value: 1,
          }, {
            name: 'minPassword',
            label: 'Minimum Password Length',
            type: 'number',
            value: 8,
          },
          {
            name: 'special-job-info-page-link',
            label: 'Special Job Info Page',
            type: 'text',
            value: '',
          },
          {
            name: 'terms-and-conditions-page',
            label: 'Terms & Conditions Page',
            type: 'text',
            value: '',
          },
          {
            name: 'privacy-policy-page',
            label: 'Privacy Policy Page',
            type: 'text',
            value: '',
          },
        ]),
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
            DELETE FROM ${Env.get('DB_DATABASE')}.tokens WHERE updated_at < DATE_SUB(NOW(), INTERVAL 5 HOUR)`,
      ),

      db.raw(`
            CREATE EVENT IF NOT EXISTS AutoDeleteExpiredVerificationTokens
            ON SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 1 HOUR
            ON COMPLETION PRESERVE
            DO
            DELETE FROM ${Env.get('DB_DATABASE')}.verification_tokens WHERE auto_delete = 1 and created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `),
    ]);
  }
}

module.exports = ProductionSeeder;
