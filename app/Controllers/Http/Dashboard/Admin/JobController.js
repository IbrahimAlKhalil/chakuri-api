'use strict';

const createJob = require('../../../../create-job/create');
const updateJob = require('../../../../create-job/update');
const db = use('Database');

class JobController {
  constructor() {
    this.table = 'jobs';
  }

  async index({request, response, auth}) {
    const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

    if (!(await validateIndex(request))) {
      return response.status(422).send();
    }

    const query = db.query()
      .from(`${this.table} as j`)
      .select('j.id', 'p.name as position', 'd.name as district', 't.name as thana', 'deadline', 'j.created_at', 'village', 'j.special')
      .join('positions as p', 'j.position_id', 'p.id')
      .join('districts as d', 'j.district_id', 'd.id')
      .join('thanas as t', 'j.thana_id', 't.id')
      .where('j.admin_job', 1)
      .where('j.rejected', 0)
      .orderBy('j.created_at', 'DESC');

    if (request.input('show') === 'mine') {
      query.where('j.user_id', auth.id);
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

  async store({request, response, auth}) {
    const user = await auth.user(['f.id as photoId']);

    const jobId = await createJob(
      request,
      response,
      user,
      user.roles.includes('Admin'),
      true
    )

    if (!jobId) {
      return response.status(422).send('');
    }

    return jobId;
  }

  async edit({params, response}) {
    const job = await db.query()
      .from(this.table)
      .where('id', params.id)
      .where('admin_job', 1)
      .first();


    if (!job) {
      return response.status(404).send('');
    }

    return job;
  }

  async update({request, response, auth, params}) {
    const user = await auth.user(['f.id as photoId']);

    const jobId = await updateJob(
      request,
      response,
      params.id,
      user,
      user.roles.includes('Admin'),
      false,
      true
    );

    if (!jobId) {
      return response.status(422).send('');
    }

    return jobId;
  }

  async destroy({params, response}) {
    try {
      await db.query().from(this.table).where('id', params.id).where('admin_job', 1).delete();
    } catch (e) {
      return response.status(422).send('');
    }
  }
}

module.exports = JobController;
