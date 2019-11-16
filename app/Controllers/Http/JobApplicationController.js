'use strict';

const {validate} = use('Validator');
const db = use('Database');

class JobApplicationController {
    async index({auth, request, response}) {
        const {validateIndex, buildSearchQuery, paginate} = require('../../helpers');

        const fields = ['parent'];
        const rules = {
            parent: 'required|integer'
        };

        if (!(await validateIndex(request, fields, rules))) {
            return response.status(422).send();
        }

        const parent = request.input('parent');

        const query = db.query();

        query.select('u.name', 'f.name as photo', 'u.id as user_id', 'u.mobile', 'u.email', 'r.dob', 'a.created_at', 'a.shortlist as shortlisted')
            .distinct('a.id')
            .from('applications as a')
            .join('users as u', 'u.id', 'a.user_id')
            .join('resumes as r', 'u.id', 'r.user_id')
            .join('jobs as j', 'a.job_id', 'j.id')
            .leftJoin('files as f', 'u.photo', 'f.id')
            .where('a.job_id', parent)
            .where('j.user_id', auth.id);

        switch (request.input('show', 'all')) {
            case 'shortlisted':
                query.where('a.shortlist', 1);
                break;
            case 'not-shortlisted':
                query.where('a.shortlist', 0);
                break;
        }

        await buildSearchQuery(request, ['u.name', 'u.mobile', 'u.email'], query);

        return await paginate(request, query);
    }

    async destroy({params, response, auth}) {
        // Check job existence and author
        const application = await db.query()
            .select('a.id')
            .from('applications as a')
            .join('jobs as j', 'a.job_id', 'j.id')
            .where('j.user_id', auth.id)
            .where('a.id', params.id)
            .first();

        if (!application) {
            return response.status(422).send();
        }

        try {
            await db.query().from('applications').where('id', params.id).delete();
        } catch (e) {
            return response.status(422).send('');
        }
    }

    async update({params, response, auth}) {
        const application = await db.select('a.shortlist')
            .from('applications as a')
            .join('jobs as j', 'j.id', 'a.job_id')
            .where('j.user_id', auth.id)
            .where('a.id', params.id)
            .first();

        if (!application) {
            return response.status(422).send('');
        }


        await db.from('applications')
            .update({shortlist: !application.shortlist})
            .where('id', params.id);

        return 'ok';
    }

    async show({request, auth, response, params}) {
        const data = request.only(['application']);

        const validation = await validate(data, {
            application: 'required|integer'
        });

        if (validation.fails()) {
            return response.status(404).send('');
        }

        const application = await db.query()
            .select('a.shortlist as shortlisted', 'a.id', 'a.user_id as userId')
            .from('applications as a')
            .join('jobs as j', 'j.id', 'a.job_id')
            .where('j.id', params.id)
            .where('a.id', data.application)
            .where('j.user_id', auth.id)
            .first();

        if (!application) {
            return response.status(422).send('');
        }


        const resumeData = await Promise.all([
            db.select([
                'u.name', 'father', 'mother', 'f.name  as photo',
                'dob', 'gender', 'r.mobile',
                'r.email', 'marital_status', 'nationality',
                'd.name as district', 'pd.name as present_district',
                't.name as thana', 'pt.name as present_thana',
                'village', 'present_village'
            ])
                .from('resumes as r')
                .leftJoin('users as u', 'u.id', 'r.user_id')
                .leftJoin('districts as d', 'd.id', 'r.district')
                .leftJoin('districts as pd', 'pd.id', 'r.present_district')
                .leftJoin('thanas as t', 't.id', 'r.thana')
                .leftJoin('thanas as pt', 'pt.id', 'r.present_thana')
                .leftJoin('files as f', 'u.photo', 'f.id')
                .where('user_id', application.userId)
                .first(),

            db.from('resume_educations')
                .where('user_id', application.userId),

            db.from('resume_trainings')
                .where('user_id', application.userId),

            db.from('resume_experiences')
                .where('user_id', application.userId)
        ]);


        return {
            resume: resumeData[0],
            educations: resumeData[1],
            trainings: resumeData[2],
            experiences: resumeData[3],
            application
        };
    }
}

module.exports = JobApplicationController;
