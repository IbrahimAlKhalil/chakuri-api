'use strict'


const db = use('Database')
const {validate} = use('Validator')

const updateRules = {
    designation: 'string|max:60',
    address: 'string|max:255',
    start: 'date',
    current: 'boolean',
    end: 'required_when:current,false|date',
    institute: 'string|max:255',
    responsibilities: 'string|max:8000'
}
const storeRules = {
    designation: `required|${updateRules.designation}`,
    address: `required|${updateRules.address}`,
    start: `required|${updateRules.start}`,
    current: updateRules.current,
    end: updateRules.end,
    institute: `required|${updateRules.institute}`,
    responsibilities: `required|${updateRules.responsibilities}`
}

class ExperienceController {
    async index({response, auth}) {
        return await db.table('resume_experiences')
            .select('institute', 'designation', 'address', 'start', 'end', 'current', 'responsibilities', 'id')
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

        const old = await db.table('resume_experiences')
            .select('id')
            .where('id', id)
            .where('user_id', auth.id)
            .first()

        if (!old) {
            return response.status(422).send('')
        }

        await db.table('resume_experiences')
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
        const id = await db.table('resume_experiences')
            .insert([data])

        return id[0]
    }

    async destroy({params, auth}) {
        const {id} = params

        const old = await db.table('resume_experiences')
            .select('id')
            .where('id', id)
            .where('user_id', auth.id)
            .first()

        if (!old) {
            return response.status(422).send('')
        }


        await db.table('resume_experiences')
            .delete()
            .where('id', id)

        return ''
    }
}

module.exports = ExperienceController
