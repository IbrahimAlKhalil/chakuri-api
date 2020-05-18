'use strict';

const db = use('Database');
const createJob = require('../../create-job/create');
const updateJob = require('../../create-job/update');

class JobController {
  constructor() {
    this.table = 'jobs';
  }

  async index({request, response, auth}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../helpers');

    if (!(await validateIndex(request))) {
      return response.status(422).send();
    }

    const query = db.query()
      .from(`${this.table} as j`)
      .select('j.id', 'p.name as position', 'd.name as district', 't.name as thana', 'deadline', 'j.created_at', 'village', 'j.approved', 'j.rejected', 'j.special', 'rj.message')
      .join('positions as p', 'j.position_id', 'p.id')
      .join('districts as d', 'j.district_id', 'd.id')
      .join('thanas as t', 'j.thana_id', 't.id')
      .leftJoin('rejected_jobs as rj', 'j.id', 'rj.job_id')
      .where('j.user_id', auth.id)
      .orderBy('j.created_at', 'DESC');

    switch (request.input('show', 'all')) {
      case 'pending':
        query.where('j.rejected', 0)
          .where('j.approved', 0);
        break;
      case 'rejected':
        query.where('j.rejected', 1);
        break;
      case 'approved':
        query.where('j.approved', 1);
    }

    await buildSearchQuery(request, ['p.name', 'd.name', 't.name', 'village'], query);

    const pagination = await paginate(request, query);

    // Load applicant count
    const applicants = Array.from(
      await db.query()
        .select('*')
        .count('id as count')
        .from('applications')
        .groupBy('job_id')
        .whereIn('job_id', pagination.data.map(item => item.id)),
    );

    pagination.data.forEach(item => {
      let removeIndex;

      applicants.some((applicant, index) => {
        const ok = applicant.job_id === item.id;

        if (ok) {
          removeIndex = index;
          item.applicants = applicant.count;
        }

        return ok;
      });

      if (removeIndex) {
        applicants.splice(removeIndex, 1);
      }
    });

    return pagination;
  }

  async show({auth, params, response}) {
    const data = await db.raw(`
      select j.id, concat(p.name, ' - ', j.village, ', ', t.name, ', ', d.name) as name
      from jobs j
             join thanas t on j.thana_id = t.id
             join districts d on j.district_id = d.id
             join positions p on j.position_id = p.id
      where j.id = ?
        and j.user_id = ?
    `, [params.id, auth.id]);

    if (!data[0].length) {
      return response.status(404).send('');
    }

    return data[0][0];
  }

  async edit({auth, params, response}) {
    const {zeroPrefix} = require('../../helpers');

    const job = await db.query()
      .from(this.table)
      .where('id', params.id)
      .where('user_id', auth.id)
      .first();


    if (!job) {
      return response.status(404).send('');
    }

    const d = new Date(job.deadline);

    job.deadline = `${d.getFullYear()}-${zeroPrefix(d.getMonth() + 1)}-${zeroPrefix(d.getDate())}`


    return job;
  }

  async update({request, response, auth, params}) {
    const jobId = await updateJob(
      request,
      response,
      params.id,
      await auth.user(['f.id as photoId'])
    );

    if (!jobId) {
      return response.status(422).send('');
    }

    return jobId;
  }

  async canStore({auth}) {
    const verification = await db.from('verification_tokens')
      .where('user_id', auth.id)
      .where('type', 'mobile')
      .first();

    return {canStore: !verification};
  }

  async store({request, response, auth}) {
    const verification = await db.from('verification_tokens')
      .where('user_id', auth.id)
      .where('type', 'mobile')
      .first();

    if (verification) {
      return response.status(422).send('অনুগ্রহ করে আগে আপনার মোবাইল নম্বরটি ভেরিফাই করুন');
    }

    const jobId = createJob(
      request,
      response,
      await auth.user(['f.id as photoId'])
    );

    if (!jobId) {
      return response.status(422).send('');
    }

    return jobId;
  }

  async destroy({params, response, auth}) {
    try {
      await db.query()
        .from(this.table)
        .where('user_id', auth.id)
        .where('id', params.id)
        .delete();
    } catch (e) {
      return response.status(422).send('');
    }
  }
}

module.exports = JobController;
