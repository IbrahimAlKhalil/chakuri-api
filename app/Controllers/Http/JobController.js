'use strict';

const {validate} = use('Validator');
const db = use('Database');
const Job = use('App/Models/Job');
const JobRequest = use('App/Models/JobRequest');
const io = require('../../../start/socket');

const rules = {
    position_id: 'required|integer|exists:positions,id',
    vacancy: 'integer|max:9999999',
    salary_from: 'integer|max:999999999999',
    salary_to: 'integer|max:99999999999',
    negotiable: 'boolean',
    nature: 'required|in:1,2',
    responsibilities: 'required|string|max:5000',
    deadline: `required|date|after:${new Date(Date.now() + 4.32e+7)}`,
    district_id: 'required|integer|exists:districts,id',
    thana_id: 'required|integer|exists:thanas,id',
    village: 'required|string|max:150',
    experience_from: 'integer|max:9999999',
    experience_to: 'integer|max:9999999',
    education: 'string|max:500',
    gender: 'in:1,2,3',
    age_from: 'integer|max:999999999',
    age_to: 'integer|max:999999999',
    additional: 'string|max:5000'
};

class JobController {
    async store({request, response, auth}) {

        const data = request.only(Object.keys(rules));

        const validation = await validate(data, rules);

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

        const {moderators, randomNumber, notify} = require('../../helpers');


        const admins = [];

        // Get all the permitted moderators except admins
        // TODO: Add option to dashboard to enable admin notification about new job
        // TODO: Add option to admin broadcast which will send every job to admins online
        const permittedMods = moderators.filter(mod => {
            const {permissions} = mod;

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
            moderator: mod.id
        });

        // The institution
        const user = await auth.user();
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
            logo: user.photo,
            position: extraInfo.position,
            deadline: job.deadline,
            experience_from: job.experience_from,
            experience_to: job.experience_to,
            created_at: job.created_at,
            thana: extraInfo.thana,
            district: extraInfo.district,
            special: job.special,
            focus: true
        });

        notify({
            user_id: mod.id,
            title: 'A job',
            message: `has been published! by ${user.name}`,
            link: `type:new-job|id:${job.id}`,
            pic: user.photo,
            seen: false
        });

        return 'আমরা আপনার বিজ্ঞাপন পর্যালোচনা করছি, দয়া করে অপেক্ষা করুন।';
    }

    async index({auth, request}) {
        const validation = await validate(request.only(['perPage', 'page']), {
            perPage: 'integer|max:30',
            page: 'integer|min:1'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 6));

        return await db.from('jobs as j')
            .select('j.id', 'p.name as position', 'd.name as district', 't.name as thana', 'deadline', 'j.created_at', 'village', 'j.approved')
            .count('a.id as applicants')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .leftJoin('applications as a', 'j.id', 'a.job_id')
            .where('j.user_id', auth.id)
            .groupBy('j.id')
            .orderBy('j.created_at', 'DESC')
            .paginate(page || 1, perPage);
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

    async getApplications({auth, request, response, params}) {
        const validation = await validate(request.all(), {
            page: 'integer|min:1',
            shortlist: 'boolean',
            keyword: 'string',
            perPage: 'integer|max:30'
        });

        if (validation.fails()) {
            console.log(validation);
            return response.status(422).send();
        }

        const query = db.query();

        query.select('u.name', 'u.photo', 'u.id as user_id', 'a.created_at')
            .distinct('a.id')
            .from('applications as a')
            .join('users as u', 'u.id', 'a.user_id')
            .join('resumes as r', 'r.user_id', 'a.user_id')
            .leftJoin('districts as d', 'd.id', 'r.district')
            .leftJoin('thanas as t', 't.id', 'r.thana')
            .leftJoin('districts as pd', 'd.id', 'r.present_district')
            .leftJoin('thanas as pt', 't.id', 'r.present_thana')
            .leftJoin('resume_educations as re', 're.user_id', 'a.user_id')
            .leftJoin('resume_experiences as rex', 'rex.user_id', 'a.user_id')
            .leftJoin('resume_trainings as rt', 'rt.user_id', 'a.user_id')
            .where('a.job_id', params.id);

        if (request.input('shortlist')) {
            query.where('a.shortlist', 1);
        }

        const keyword = request.input('keyword');

        if (keyword) {
            const keywords = keyword.trim().split(' ').join('|');
            const cols = [
                'u.name', 'u.mobile', 'u.email',
                'r.gender', 'r.mobile', 'r.email', 'r.marital_status', 'r.nationality',
                'd.name', 't.name', 'village', 'pd.name', 'pt.name', 'present_village',
                're.madrasa', 'rex.designation', 'rt.title', 'rt.topics',
                'rt.institute'
            ];

            let conditions = '';

            cols.forEach((col, index) => {
                conditions += `${col} regexp ?`;

                if (index !== cols.length - 1) {
                    conditions += ' or ';
                }
            });

            query.whereRaw(`(${conditions})`, new Array(cols.length).fill(keywords));
        }

        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 8));

        return await query.paginate(page, perPage);
    }
}

module.exports = JobController;
