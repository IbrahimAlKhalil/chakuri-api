'use strict'

const Resume = use('App/Models/Resume')
const {validate} = use('Validator')

const rules = {
    name: 'string',
    father: 'string',
    mother: 'string',
    mobile: 'mobile',
    email: 'email',
    dob: 'date',
    gender: 'in:পুরুষ,মহিলা',
    marital_status: 'in:বিবাহিত,অবিবাহিত',
    nationality: 'string'
}

class PersonalController {
    async store({request, response, auth}) {

        const data = request.only(Object.keys(rules))

        const validation = await validate(data, rules)

        if (validation.fails()) {
            return response.status(422).send('')
        }

        await Resume
            .query()
            .where('user_id', auth.id)
            .update(data)

        return ''
    }

    async index({auth}) {
        return await Resume
            .query()
            .select(Object.keys(rules))
            .where('user_id', auth.id)
            .first()
    }
}

module.exports = PersonalController
