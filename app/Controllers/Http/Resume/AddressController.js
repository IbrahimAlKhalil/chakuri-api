'use strict'

const Resume = use('App/Models/Resume')
const {validate} = use('Validator')

const rules = {
    present_district: 'exists:districts:id',
    present_thana: 'exists:thanas:id',
    district: 'exists:districts:id',
    thana: 'exists:thanas:id',
    present_village: 'string',
    village: 'string'
}

class AddressController {
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
            .select('district', 'thana', 'present_district', 'present_thana', 'village', 'present_village')
            .where('resumes.user_id', auth.id)
            .first()
    }
}

module.exports = AddressController
