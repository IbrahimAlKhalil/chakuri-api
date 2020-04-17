'use strict';

const { validate } = use('Validator');
const db = use('Database');
const Job = use('App/Models/Job');
const JobRequest = use('App/Models/JobRequest');
const io = require('../../../start/socket');

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
};

class JobController {
  constructor() {
    this.table = 'jobs';
  }

  async index({ request, response, auth }) {
    const { validateIndex, buildSearchQuery, paginate } = require('../../helpers');

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

  async show({ auth, params, response }) {
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

  async edit({ auth, params, response }) {
    const { zeroPrefix } = require('../../helpers');

    const job = await db.query()
      .select(Object.keys(rules))
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

  async update({ request, response, auth, params }) {

    const data = request.only(Object.keys(rules));

    const validation = await validate(data, rules);

    if (validation.fails()) {
      return response.status(422).send('');
    }


    const job = await Job.find(params.id);

    if (job.user_id !== auth.id) {
      return response.status(404).send('');
    }

    data.negotiable = data.negotiable ? 1 : 0;

    for (const key in data) {
      job[key] = data[key];
    }

    job.approved = 0;

    await job.save();

    // Delete old job request
    await db.query()
      .from('job_requests')
      .where('job_id', job.id)
      .delete();

    await this.notifyModerator(
      job,
      await auth.user(['f.id as photoId']),
      await this.createJobRequest(job),
    );


    return job.id;
  }

  async createJobRequest(job) {
    const { moderators: getMods, randomNumber } = require('../../helpers');

    const moderators = await getMods();

    const admins = [];

    // Get all the permitted moderators except admins
    // TODO: Add option to dashboard to enable admin notification about new job
    // TODO: Add option to admin broadcast which will send every job to admins online
    const permittedMods = moderators.filter(mod => {
      const { permissions } = mod;

      // Push admin to admin array for late use
      if (mod.admin) {
        admins.push(mod);
      }

      if (!mod.admin && permissions.includes('all')) {
        return true;
      }

      return !mod.admin && permissions.includes('job-posts');
    });

    // Get online moderators
    const onlineMods = permittedMods.filter(mod => {
      const room = io.sockets.adapter.rooms[`u-${mod.id}`];

      return room && room.length;
    });

    // Pick one of the online moderators randomly,
    // if none of them are online then choose one from the permitted moderators
    let mod = onlineMods.length ? onlineMods[randomNumber(onlineMods.length - 1, 0)]
      : permittedMods[randomNumber(permittedMods.length - 1, 0)];


    // There can be no moderators except admin, in that situation
    // pick one of the online admins, if no admin is online then choose one randomly
    if (!mod) {
      const onlineAdmins = admins.filter(mod => {
        const room = io.sockets.adapter.rooms[`u-${mod.id}`];

        return room && room.length;
      });

      mod = onlineAdmins.length ? onlineAdmins[randomNumber(onlineAdmins.length - 1, 0)]
        : admins[randomNumber(admins.length - 1, 0)];
    }


    await JobRequest.create({
      job_id: job.id,
      moderator: mod.id,
    });

    return mod;
  }

  async notifyModerator(job, user, mod) {
    const { notify } = require('../../helpers');

    const room = io.to(`u-${mod.id}`);


    // Get position
    const extraInfo = await db.query()
      .select('p.name as position', 'd.name as district', 't.name as thana')
      .from('jobs as j')
      .join('positions as p', 'p.id', 'j.position_id')
      .join('districts as d', 'd.id', 'j.district_id')
      .join('thanas as t', 't.id', 'j.thana_id')
      .where('j.id', job.id)
      .first();

    // Send job realtime
    room.emit('nj', {
      id: job.id,
      salary_from: job.salary_from,
      salary_to: job.salary_to,
      institute: user.name,
      logo: user.photoId,
      position: extraInfo.position,
      deadline: job.deadline,
      experience_from: job.experience_from,
      experience_to: job.experience_to,
      created_at: job.created_at,
      thana: extraInfo.thana,
      district: extraInfo.district,
      special: job.special,
      focus: true,
    });

    notify({
      user_id: mod.id,
      title: 'A job',
      message: `has been published! by ${user.name}`,
      link: JSON.stringify({
        type: 'new-job',
        id: job.id,
      }),
      pic: user.photoId,
      seen: false,
    });
  }

  async store({ request, response, auth }) {

    const data = request.only(Object.keys(rules));

    const validation = await validate(data, rules);

    if (validation.fails()) {
      return response.status(422).send('');
    }

    data.user_id = auth.id;

    const booleans = ['negotiable', 'special'];

    booleans.forEach(item => {
      data[item] = data[item] ? 1 : 0;
    })

    const job = new Job;

    for (const key in data) {
      job[key] = data[key];
    }

    await job.save();

    await this.notifyModerator(
      job,
      await auth.user(['f.id as photoId']),
      await this.createJobRequest(job),
    );

    return job.id;
  }

  async destroy({ params, response }) {
    try {
      await db.query().from(this.table).where('id', params.id).delete();
    } catch (e) {
      return response.status(422).send('');
    }
  }
}

module.exports = JobController;
