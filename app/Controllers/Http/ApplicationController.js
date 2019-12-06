'use strict';

const {validate} = use('Validator');
const db = use('Database');
const Application = use('App/Models/Application');

class ApplicationController {
    async index({auth, request}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../helpers');

        if (!(await validateIndex(request))) {
            return response.status(422).send();
        }

        const query = db.query().from('jobs');

        query.from('applications as a')
            .select(
                'j.id', 'u.name as institute', 'f.name as logo', 'j.special',
                'd.name as district', 't.name as thana', 'p.name as position',
                'j.salary_from', 'j.salary_to', 'j.created_at',
                'j.deadline', 'j.experience_from', 'j.experience_to'
            )
            .distinct()
            .join('jobs as j', 'j.id', 'a.job_id')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('users as u', 'u.id', 'j.user_id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .where('a.user_id', auth.id)
            .whereRaw('deadline > NOW()')
            .leftJoin('files as f', 'u.photo', 'f.id')
            .orderBy('a.created_at', 'DESC');


        await buildSearchQuery(request, ['u.name', 'p.name', 'd.name', 't.name'], query);

        return await paginate(request, query);
    }

    async store({request, response, auth}) {
        const validation = await validate(request.only(['id']), {
            id: 'integer'
        });


        if (validation.fails()) {
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন');
        }

        const id = request.input('id');

        // Check if job exists
        // Deadline must not be over
        // Ad must be approved


        const rows = await Promise.all([
            db.select('j.id', 'j.user_id', 'p.name')
                .from('jobs as j')
                .join('positions as p', 'j.position_id', 'p.id')
                .where('j.approved', 1)
                .where('j.deadline', '>=', new Date().toISOString())
                .where('j.id', id)
                .first(),
            db.select('id')
                .from('applications')
                .where('user_id', auth.id)
                .where('job_id', id)
                .first()
        ]);

        const job = rows[0];
        const oldApplication = rows[1];

        if (!job) {
            // Ad doesn't exist
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন');
        }

        if (oldApplication) {
            // Already applied
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন');
        }

        const application = new Application;

        application.job_id = id;
        application.user_id = auth.id;

        await application.save();

        const user = await auth.user(['f.id as photoId']);

        const {notify} = require('../../helpers');

        await notify({
            user_id: job.user_id,
            title: user.name,
            message: `${job.name}  পদের জন্য আবেদন করেছেন`,
            seen: 0,
            pic: user.photoId,
            link: JSON.stringify({
                type: 'applied',
                id: application.id
            })
        });

        return 'আপনার আবেদন জমা দেওয়া হয়েছে';
    }
}

module.exports = ApplicationController;
