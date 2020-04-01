'use strict';

const {validate} = use('Validator');
const db = use('Database');
const Job = use('App/Models/Job');
const RejectedJob = use('App/Models/RejectedJob');
const JobRequest = use('App/Models/JobRequest');

class JobRequestController {
  async index({request, auth, response}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

    if (!(await validateIndex(request))) {
      return response.status(422).send();
    }

    const query = db.query();

    query.from('job_requests as jr')
      .select(
        'j.id', 'u.name as institute', 'f.name as logo', 'j.special',
        'd.name as district', 't.name as thana', 'p.name as position',
        'j.salary_from', 'j.salary_to', 'j.created_at',
        'j.deadline', 'j.experience_from', 'j.experience_to',
      )
      .distinct()
      .join('jobs as j', 'j.id', 'jr.job_id')
      .join('positions as p', 'j.position_id', 'p.id')
      .join('users as u', 'u.id', 'j.user_id')
      .join('districts as d', 'j.district_id', 'd.id')
      .join('thanas as t', 'j.thana_id', 't.id')
      .leftJoin('files as f', 'u.photo', 'f.id')
      .where('j.approved', 0)
      .where('j.rejected', 0)
      .orderBy('j.created_at', 'DESC');

    const moderator = await auth.user();

    if (!moderator.roles.includes('Admin')) {
      query.where('jr.moderator', auth.id);
    }


    await buildSearchQuery(request, ['u.name', 'p.name', 'd.name', 't.name'], query);

    return await paginate(request, query);
  }

  async action({request, auth, response}) {
    const {notify} = require('../../../../helpers');

    const validation = await validate(request.only(['type', 'id', 'cause']), {
      type: 'required|in:approve,reject',
      id: 'required|integer',
      cause: 'string|max:8000',
    });


    if (validation.fails()) {
      return response.status(422).send();
    }

    const id = Number(request.input('id'));

    const jobRequest = await JobRequest.query()
      .from('job_requests')
      .where('job_id', id)
      .first();

    if (!jobRequest) {
      return response.status(422).send();
    }


    if (jobRequest.job_id !== id) {
      return response.status(422).send();
    }


    const job = await Job.find(request.input('id'));

    // Admin can delete or approve any job request
    const moderator = await auth.user();
    if (jobRequest.moderator !== auth.id && !moderator.roles.includes('Admin')) {
      return response.status(422).send();
    }


    // Delete previous rejected_job
    await db.query()
      .from('rejected_jobs')
      .where('job_id', id)
      .delete();

    if (request.input('type') === 'approve') {
      await db.query()
        .from('jobs')
        .where('id', id)
        .update({
          approved: 1,
          rejected: 0,
        });

      await notify({
        user_id: job.user_id,
        title: 'আপনার বিজ্ঞাপনটি',
        message: 'অনুমোদন দেয়া হয়েছে',
        seen: 0,
        link: JSON.stringify({
          type: 'job-approved',
          id: id,
        }),
      });
    } else {

      const rejected = new RejectedJob();
      rejected.job_id = id;
      rejected.message = request.input('cause');

      await rejected.save();

      await db.query()
        .from('jobs')
        .where('id', id)
        .update({
          rejected: 1,
        });

      await notify({
        user_id: job.user_id,
        title: 'আপনার বিজ্ঞাপনটি',
        message: 'প্রত্যাখ্যান করা হয়েছে',
        seen: 0,
        link: JSON.stringify({
          type: 'job-rejected',
          id: id,
        }),
      });
    }
  }
}

module.exports = JobRequestController;
