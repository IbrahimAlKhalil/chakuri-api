'use strict'

const {validate} = use('Validator')
const db = use('Database')
const Application = use('App/Models/Application')

class ApplicationController {
    async index({auth, request}) {
        const validation = await validate(request.only(['perPage', 'page']), {
            perPage: 'integer|max:30',
            page: 'integer|min:1'
        })

        if (validation.fails()) {
            return response.status(422).send()
        }

        // TODO: Show only approved
        return await db.select(
            'jobs.id',
            'experience_from',
            'experience_to',
            'salary_from',
            'salary_to',
            'deadline',
            'positions.name as position',
            'districts.name as district',
            'thanas.name as thana',
            'users.name as institute',
            'files.id as logo'
        )
            .from('jobs')
            .join('positions', 'jobs.position_id', 'positions.id')
            .join('districts', 'jobs.district_id', 'districts.id')
            .join('thanas', 'jobs.thana_id', 'thanas.id')
            .join('users', 'jobs.user_id', 'users.id')
            .join('applications', 'jobs.id', 'applications.job_id')
            .leftJoin('file_user', 'jobs.user_id', 'file_user.user_id')
            .leftJoin('files', 'file_user.file_id', 'files.id')
            .where('applications.user_id', auth.id)
            .paginate(Number(request.input('page', 1)), Number(request.input('perPage', 10)))
    }

    async store({request, response, auth}) {
        const validation = await validate(request.only(['id']), {
            id: 'integer'
        })


        if (validation.fails()) {
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন')
        }

        const id = request.input('id')

        // Check if job exists
        // Deadline must not be over
        // Ad must be approved


        const rows = await Promise.all([
            db.select('id')
                .from('jobs')
                .where('approved', 1)
                // TODO: Change approved
                .where('deadline', '>=', new Date().toISOString())
                .where('id', id)
                .first(),
            db.select('id')
                .from('applications')
                .where('user_id', auth.id)
                .where('job_id', id)
                .first()
        ])

        const job = rows[0]
        const oldApplication = rows[1]

        if (!job) {
            // Ad doesn't exist
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন')
        }

        if (oldApplication) {
            // Already applied
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন')
        }

        const application = new Application

        application.job_id = id
        application.user_id = auth.id

        await application.save()

        return 'আপনার আবেদন জমা দেওয়া হয়েছে'
    }

    async shortlist({params, response, auth}) {
        const application = await db.select('a.shortlist')
            .from('applications as a')
            .join('jobs as j', 'j.id', 'a.job_id')
            .where('j.user_id', auth.id)
            .where('a.id', params.id)
            .first()

        if (!application) {
            return response.status(422).send('')
        }


        await db.from('applications')
            .update({shortlist: !application.shortlist})
            .where('id', params.id)

        return 'ok'
    }
}

module.exports = ApplicationController
