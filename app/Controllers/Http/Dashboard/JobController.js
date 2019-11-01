'use strict';

const {validate} = use('Validator');
const db = use('Database');
const Job = use('App/Models/Job');
const RejectedJob = use('App/Models/RejectedJob');
const JobRequest = use('App/Models/JobRequest');

class JobController {
    async index({request, auth, response}) {
        const validation = await validate(request.only(['perPage', 'page', 'take']), {
            perPage: 'integer|max:30',
            page: 'integer|min:1',
            take: 'integer|max:30'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 6));

        // TODO: Serve all jobs without any condition if user is admins

        const pagination = await db.from('job_requests as jr')
            .select(
                'j.id', 'u.name as institute', 'u.photo as logo', 'j.special',
                'd.name as district', 't.name as thana', 'p.name as position',
                'j.salary_from', 'j.salary_to', 'j.created_at',
                'j.deadline', 'j.experience_from', 'j.experience_to'
            )
            .join('jobs as j', 'j.id', 'jr.job_id')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('users as u', 'u.id', 'j.user_id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .where('jr.moderator', auth.id)
            .where('j.approved', 0)
            .where('j.rejected', 0)
            .orderBy('j.created_at', 'DESC')
            .paginate(page || 1, perPage);

        const take = request.input('take', perPage);

        pagination.data = pagination.data.slice(pagination.data.length - take, pagination.data.length);

        return pagination;
    }

    async count({auth}) {
        return await db.from('job_requests as jr')
            .join('jobs as j', 'j.id', 'jr.job_id')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('users as u', 'u.id', 'j.user_id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .where('jr.moderator', auth.id)
            .where('j.approved', 0)
            .count('jr.id as count')
            .first();
    }

    async action({request, response, auth}) {
        const {notify} = require('../../../helpers');

        const validation = await validate(request.only(['type', 'id', 'cause']), {
            type: 'required|in:approve,reject',
            id: 'required|integer|exists:jobs,id',
            cause: 'string|max:8000'
        });

        const moderator = await auth.user();

        const jobRequest = await JobRequest.query()
            .from('job_requests')
            .where('job_id', request.input('id'))
            .where('moderator', auth.id)
            .first();

        if (!jobRequest || !moderator.roles.includes('Admin')) {
            return response.status(422).send();
        }

        if (validation.fails()) {
            return response.status(422).send();
        }

        const job = await Job.find(request.input('id'));


        if (request.input('type') === 'approve') {
            job.approved = 1;
            await job.save();

            await notify({
                user_id: job.user_id,
                title: 'আপনার বিজ্ঞাপনটি',
                message: 'অনুমোদন দেয়া হয়েছে',
                seen: 0,
                link: `type:job-approved|id:${job.id}`
            });
        } else {
            const rejected = new RejectedJob();
            rejected.job_id = job.id;
            rejected.message = request.input('cause');

            await rejected.save();

            job.rejected = 1;
            await job.save();

            await notify({
                user_id: job.user_id,
                title: 'আপনার বিজ্ঞাপনটি',
                message: 'প্রত্যাখ্যান করা হয়েছে',
                seen: 0,
                link: `type:job-rejected|id:${job.id}`
            });
        }
    }
}

module.exports = JobController;
