'use strict'

const db = use('Database')
const {validate} = use('Validator')

const updateRules = {
    title: 'string|max:190',
    topics: 'string|max:190',
    get year() {
        const years = []

        for (let i = 1950; i < (new Date).getFullYear() + 2; i++) {
            years.unshift(i)
        }

        return `in:${years.join(',')}`

    },
    duration: 'string|max:40',
    institute: 'string|max:190'
}
const storeRules = {
    title: `required|${updateRules.title}`,
    topics: `required|${updateRules.topics}`,
    year: `required|${updateRules.year}`,
    duration: `required|${updateRules.duration}`,
    institute: `required|${updateRules.institute}`
}

class TrainingController {
    async index({response, auth}) {
        return await db.table('resume_trainings')
            .select('title', 'topics', 'year', 'institute', 'duration', 'id')
            .where('user_id', auth.id)
    }

    async update({request, params, response, auth}) {
        const {id} = params
        const data = request.only(Object.keys(updateRules))

        const validation = await validate(data, updateRules)

        // Validate request
        if (validation.fails()) {
            return response.status(422).send('')
        }

        const old = await db.table('resume_trainings')
            .select('id')
            .where('id', id)
            .where('user_id', auth.id)
            .first()

        if (!old) {
            return response.status(422).send('')
        }

        await db.table('resume_trainings')
            .update(data)
            .where('id', id)

        return response.send('')
    }

    async store({request, response, auth}) {
        const data = request.only(Object.keys(storeRules))

        const validation = await validate(data, storeRules)

        if (validation.fails()) {
            return response.status(422).send('')
        }

        data.user_id = auth.id
        const id = await db.table('resume_trainings')
            .insert([data])

        return id[0]
    }

    async destroy({params, auth}) {
        const {id} = params

        const old = await db.table('resume_trainings')
            .select('id')
            .where('id', id)
            .where('user_id', auth.id)
            .first()

        if (!old) {
            return response.status(422).send('')
        }


        await db.table('resume_trainings')
            .delete()
            .where('id', id)

        return ''
    }
}

module.exports = TrainingController
