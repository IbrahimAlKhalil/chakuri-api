'use strict';

const findReviewers = require('../../../../create-job/find-reviewers');
const RejectedJob = use('App/Models/RejectedJob');
const io = require('../../../../../start/socket');
const JobRequest = use('App/Models/JobRequest');
const {validate} = use('Validator');
const Job = use('App/Models/Job');
const db = use('Database');

class JobRequestController {
  async index({request, auth, response}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

    if (!(await validateIndex(request))) {
      return response.status(422).send();
    }

    const query = db.query().from('jobs as j');

    query.select(
      'j.id', 'u.name as institute', 'f.name as logo', 'j.special',
      'd.name as district', 't.name as thana', 'p.name as position',
      'j.salary_from', 'j.salary_to', 'j.created_at',
      'j.deadline', 'j.experience_from', 'j.experience_to',
      'jr.moderator as assignee'
    )
      .distinct()
      .join('positions as p', 'j.position_id', 'p.id')
      .join('users as u', 'u.id', 'j.user_id')
      .join('districts as d', 'j.district_id', 'd.id')
      .join('thanas as t', 'j.thana_id', 't.id')
      .leftJoin('files as f', 'u.photo', 'f.id')
      .leftJoin('job_requests as jr', 'jr.job_id', 'j.id')
      .where('j.approved', 0)
      .where('j.rejected', 0)
      .where('u.id', '!=', auth.id)
      .orderBy('j.created_at', 'DESC');

    if (!(await this.canReviewAdminJob(auth))) {
      query.where('j.admin_job', 0);
    }

    await buildSearchQuery(request, ['u.name', 'p.name', 'd.name', 't.name'], query);

    return await paginate(request, query);
  }

  async assign({auth, response, params}) {
    const {id} = params;

    // Check if the request is already assigned
    const jobRequest = await db.from('job_requests').where('job_id', id).first();

    if (jobRequest) {
      return response.status(422).send('This job is already assigned to someone');
    }

    const job = await Job.find(id);

    if (job.admin_job && !(await this.canReviewAdminJob(auth))) {
      return response.status(422).send('You are not permitted to review jobs posted by a moderator');
    }

    const reviewers = await findReviewers(auth.id);

    for (const reviewer of reviewers) {
      const room = io.to(`u-${reviewer.id}`);

      // Notify all the moderators who have been notified before about the request
      room.emit('ja', id);
    }

    await JobRequest.create({
      job_id: id,
      moderator: auth.id,
    });
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
      .where('moderator', auth.id)
      .first();

    if (!jobRequest) {
      return response.status(422).send();
    }

    const job = await Job.find(request.input('id'));

    if (job.admin_job && !(await this.canReviewAdminJob(auth))) {
      return response.status(422).send('You are not permitted to review jobs posted by a moderator');
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

      await jobRequest.delete();

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

      await jobRequest.delete();

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

  async canReviewAdminJob(auth) {
    const {permissions, roles} = (await auth.user());

    return roles.includes('Admin')
      || permissions.includes('all')
      || permissions.includes('review-admin-job');
  }
}

module.exports = JobRequestController;
