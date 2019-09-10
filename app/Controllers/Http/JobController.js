'use strict'

const {validate} = use('Validator')
const db = use('Database')
const Job = use('App/Models/Job')

const rules = {
    name: 'required|string|max:150',
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
}

class JobController {
    async store({request, response, auth}) {
        const data = request.only(Object.keys(rules))

        const validation = await validate(data, rules)

        if (validation.fails()) {
            return response.status(422).send('')
        }

        data.user_id = auth.id
        data.negotiable = data.negotiable ? 1 : 0

        const job = new Job

        for (const key in data) {
            job[key] = data[key]
        }

        await job.save()

        return 'আমরা আপনার বিজ্ঞাপন পর্যালোচনা করছি, দয়া করে অপেক্ষা করুন।'
    }

    async index({auth, request}) {
        return db.from('jobs as j')
            .select('j.id', 'j.name', 'p.name as position', 'd.name as district', 't.name as thana', 'deadline', 'j.created_at', 'village')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .where('user_id', auth.id)
            .orderBy('j.created_at', 'DESC')
    }
}

module.exports = JobController
