'use strict';

const {validate} = use('Validator');
const db = use('Database');
const Job = use('App/Models/Job');

const rules = {
  position_id: 'required|integer|exists:positions,id',
  vacancy: 'max:9999999',
  salary_from: 'max:999999999999',
  salary_to: 'max:99999999999',
  negotiable: 'boolean',
  special: 'boolean',
  nature: 'in:1,2',
  responsibilities: 'string|max:5000',
  deadline: `required|date|after:${new Date(Date.now() + 4.32e+7)}`,
  district_id: 'required|integer|exists:districts,id',
  thana_id: 'required|integer|exists:thanas,id',
  village: 'required|string|max:150',
  experience_from: 'integer|max:9999999',
  experience_to: 'max:9999999',
  education: 'max:500',
  gender: 'in:1,2,3',
  age_from: 'max:999999999',
  age_to: 'max:999999999',
  additional: 'string|max:5000',
  how_to_apply: 'required|string|max:5000',
  institute_name: 'required|string|max:200',
};

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

    const data = request.only(Object.keys(rules));

    const validation = await validate(data, rules);

    data.admin_job = 1;
    data.approved = 1;

    if (validation.fails()) {
      return response.status(422).send('');
    }

    data.user_id = auth.id;
    data.negotiable = data.negotiable ? 1 : 0;

    const job = new Job;

    for (const key in data) {
      job[key] = data[key];
    }

    await job.save();

    return job.id;
  }

  async edit({params, response}) {
    const job = await db.query()
      .select(Object.keys(rules))
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

    const data = request.only(Object.keys(rules));

    const validation = await validate(data, rules);

    if (validation.fails()) {
      return response.status(422).send('');
    }


    const job = await Job.query().where('admin_job', 1).where('id', params.id).first();

    if (job.user_id !== auth.id) {
      return response.status(404).send('');
    }

    data.negotiable = data.negotiable ? 1 : 0;

    for (const key in data) {
      job[key] = data[key];
    }

    await job.save();

    return job.id;
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
