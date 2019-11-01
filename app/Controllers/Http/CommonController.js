'use strict'

const db = use('Database')

class CommonController {
    async institutionCount() {
        const counts = await Promise.all([
            db.from('institutions').count('id as count'),
            db.from('jobs').where('approved', true).count('id as count')
        ])


        return {institute: counts[0][0].count, job: counts[1][0].count}
    }

    time() {
        return Date.now()
    }

    async favoriteAndApplied({params, auth}) {
        const {jobId} = params
        const {id} = auth

        const tables = ['favorites', 'applications']

        const rows = await Promise.all(
            tables.map(table => db.select('id')
                .from(table)
                .where('job_id', jobId)
                .where('user_id', id)
                .first()
            )
        )

        return {
            favorite: !!rows[0],
            applied: !!rows[1]
        }
    }
}

module.exports = CommonController
