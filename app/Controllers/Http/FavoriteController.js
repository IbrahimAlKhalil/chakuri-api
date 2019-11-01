'use strict'

const {validate} = use('Validator')
const db = use('Database')
const Favorite = use('App/Models/Favorite')

class FavoriteController {
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
            .join('favorites', 'jobs.id', 'favorites.job_id')
            .leftJoin('file_user', 'jobs.user_id', 'file_user.user_id')
            .leftJoin('files', 'file_user.file_id', 'files.id')
            .where('favorites.user_id', auth.id)
            .paginate(request.input('page', 1), request.input('perPage', 10))
    }

    async store({request, response, auth}) {
        const validation = await validate(request.only(['id']), {
            id: 'integer'
        })


        if (validation.fails()) {
            return response.status(422).send('কিছু ভুল হয়েছে আবার চেষ্টা করুন')
        }

        const id = request.input('id')

        const old = await db.select('id')
            .from('favorites')
            .where('user_id', auth.id)
            .where('job_id', id)
            .delete()

        if (old) {
            return ''
        }


        // Check if job exists
        // Deadline must not be over
        // Job must be approved


        const job = db.select('id')
            .from('jobs')
            .where('approved', 0)
            // TODO: Change approved
            .where('deadline', '>=', new Date().toISOString())
            .where('id', id)
            .first()

        if (!job) {
            // Job doesn't exist
            return response.status(422).send('')
        }

        const favorite = new Favorite

        favorite.job_id = id
        favorite.user_id = auth.id

        await favorite.save()

        return ''
    }
}

module.exports = FavoriteController
