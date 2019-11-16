'use strict';

const {validate} = use('Validator');
const db = use('Database');
const Favorite = use('App/Models/Favorite');

class FavoriteController {
    async index({auth, request}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../helpers');

        if (!(await validateIndex(request))) {
            return response.status(422).send();
        }

        const query = db.query().from('jobs');

        query.from('favorites as fa')
            .select(
                'j.id', 'u.name as institute', 'f.name as logo', 'j.special',
                'd.name as district', 't.name as thana', 'p.name as position',
                'j.salary_from', 'j.salary_to', 'j.created_at',
                'j.deadline', 'j.experience_from', 'j.experience_to'
            )
            .distinct()
            .join('jobs as j', 'j.id', 'fa.job_id')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('users as u', 'u.id', 'j.user_id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .where('fa.user_id', auth.id)
            .whereRaw('deadline > NOW()')
            .leftJoin('files as f', 'u.photo', 'f.id')
            .orderBy('fa.created_at', 'DESC');


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

        const old = await db.select('id')
            .from('favorites')
            .where('user_id', auth.id)
            .where('job_id', id)
            .delete();

        if (old) {
            return '';
        }


        // Check if job exists
        // Deadline must not be over
        // Job must be approved


        const job = db.select('id')
            .from('jobs')
            .where('approved', 0)
            // TODO: Change approved
            .where('deadline', '>=', new Date().toISOString())
            .where('id', id)
            .first();

        if (!job) {
            // Job doesn't exist
            return response.status(422).send('');
        }

        const favorite = new Favorite;

        favorite.job_id = id;
        favorite.user_id = auth.id;

        await favorite.save();

        return '';
    }
}

module.exports = FavoriteController;
