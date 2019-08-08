'use strict'

const db = use('Database')
const {validate} = use('Validator')

const updateRules = {
    madrasa: 'string|max:190|min:10',
    marhala: 'in:তাকমিল,ফযীলত,সানাবিয়া উলইয়া,মুতাওয়াসসিতাহ,ইবতিদাইয়্যাহ,হিফযুল কুরআন,ইলমুত তাজবীদ ওয়াল কিরাআত',
    result: 'in:মুমতাজ,জায়্যিদ জিদ্দান,জায়্যিদ,মকবুল,রাসিব',
    get year() {
        const years = []

        for (let i = 1950; i < (new Date).getFullYear() + 2; i++) {
            years.unshift(i)
        }

        return `in:${years.join(',')}`

    }
}
const storeRules = {
    madrasa: `required|${updateRules.madrasa}`,
    marhala: `required|${updateRules.marhala}`,
    result: updateRules.result,
    get year() {
        return `required|${updateRules.year}`
    }
}

class EducationController {
    async index({response, auth}) {
        return await db.table('resume_educations')
            .select('marhala', 'madrasa', 'year', 'result', 'id')
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

        const resumeEducation = await db.table('resume_educations')
            .select('id')
            .where('id', id)
            .where('user_id', auth.id)
            .first()

        if (!resumeEducation) {
            return response.status(422).send('')
        }

        await db.table('resume_educations')
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
        const id = await db.table('resume_educations')
            .insert([data])

        return id[0]
    }

    async destroy({params, auth}) {
        const {id} = params

        const resumeEducation = await db.table('resume_educations')
            .select('id')
            .where('id', id)
            .where('user_id', auth.id)
            .first()

        if (!resumeEducation) {
            return response.status(422).send('')
        }


        await db.table('resume_educations')
            .delete()
            .where('id', id)

        return ''
    }
}

module.exports = EducationController
