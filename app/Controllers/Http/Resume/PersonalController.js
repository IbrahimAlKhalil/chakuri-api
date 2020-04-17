'use strict'

const Resume = use('App/Models/Resume')
const db = use('Database')
const { validate } = use('Validator')

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
    async store({ request, response, auth }) {

        const data = request.only(Object.keys(rules))

        const validation = await validate(data, rules)

        if (validation.fails()) {
            return response.status(422).send('')
        }

        const name = data.name

        delete data.name

        if (name) {
            await db.from('users')
                .where('id', auth.id)
                .update('name', request.input('name'))
        }

        await Resume
            .query()
            .where('user_id', auth.id)
            .update(data)

        return ''
    }

    async index({ auth }) {
        const { zeroPrefix } = require('../../../helpers');

        const cols = Object.keys(rules)

        cols[cols.indexOf('name')] = 'u.name'
        cols[cols.indexOf('mobile')] = 'r.mobile'
        cols[cols.indexOf('email')] = 'r.email'

        const data = await db.select(cols)
            .from('resumes as r')
            .join('users as u', 'u.id', 'r.user_id')
            .where('user_id', auth.id)
            .first()

        if (data.dob) {
            const d = new Date(data.dob);

            data.dob = `${d.getFullYear()}-${zeroPrefix(d.getMonth() + 1)}-${zeroPrefix(d.getDate())}`
        }

        return data;
    }
}

module.exports = PersonalController
