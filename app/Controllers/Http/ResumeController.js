'use strict'

const {validate} = use('Validator')
const db = use('Database')

class ResumeController {
    async showResume({request, auth, response}) {
        const data = request.only(['applicant', 'job'])

        const validation = await validate(data, {
            job: 'required|integer',
            applicant: 'required|integer'
        })

        if (validation.fails()) {
            return response.status(422).send('')
        }

        const application = await db.select('a.shortlist', 'a.id').from('applications as a')
            .join('jobs as j', 'j.id', 'a.job_id')
            .where('j.id', data.job)
            .where('a.user_id', data.applicant)
            .where('j.user_id', auth.id)
            .first()

        if (!application) {
            return response.status(422).send('')
        }


        const resumeData = await Promise.all([
            db.select([
                'u.name', 'father', 'mother', 'u.photo',
                'dob', 'gender', 'r.mobile',
                'r.email', 'marital_status', 'nationality',
                'd.name as district', 'pd.name as present_district',
                't.name as thana', 'pt.name as present_thana',
                'village', 'present_village'
            ])
                .from('resumes as r')
                .join('users as u', 'u.id', 'r.user_id')
                .join('districts as d', 'd.id', 'r.district')
                .join('districts as pd', 'pd.id', 'r.present_district')
                .join('thanas as t', 't.id', 'r.thana')
                .join('thanas as pt', 'pt.id', 'r.present_thana')
                .where('user_id', data.applicant)
                .first(),

            db.from('resume_educations')
                .where('user_id', data.applicant),

            db.from('resume_trainings')
                .where('user_id', data.applicant),

            db.from('resume_experiences')
                .where('user_id', data.applicant)
        ])


        return {
            resume: resumeData[0],
            educations: resumeData[1],
            trainings: resumeData[2],
            experiences: resumeData[3],
            application
        }
    }
}

module.exports = ResumeController
