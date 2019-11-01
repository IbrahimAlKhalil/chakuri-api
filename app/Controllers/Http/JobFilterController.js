'use strict';
const db = use('Database');
const {validate} = use('Validator');
const Job = use('App/Models/Job');

class JobFilterController {
    async filter({request, response}) {
        const validation = await validate(request.all(), {
            page: 'integer|min:1',
            keyword: 'string',
            perPage: 'integer|max:30',
            types: 'arrayOfInt',
            categories: 'arrayOfInt',
            district: 'integer:allowNull',
            thana: 'integer:allowNull',
            positions: 'integer:allowNull',
            // gender: 'in:1,2,3'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        const query = Job.query();

        // TODO: Show only approved
        query.select(
            'j.id',
            'experience_from',
            'experience_to',
            'education',
            'p.name as position',
            'd.name as district',
            't.name as thana',
            'u.name as institute',
            'f.id as logo',
            'j.salary_from',
            'j.salary_to'
        )
            .from('jobs as j')
            .join('positions as p', 'j.position_id', 'p.id')
            .join('districts as d', 'j.district_id', 'd.id')
            .join('thanas as t', 'j.thana_id', 't.id')
            .join('users as u', 'j.user_id', 'u.id')
            .join('institutions as i', 'i.user_id', 'j.user_id')
            .leftJoin('file_user', 'j.user_id', 'file_user.user_id')
            .leftJoin('files as f', 'file_user.file_id', 'f.id');


        const categories = request.input('categories');
        if (categories && categories.length) {
            query.whereIn('i.category_id', categories);
        }

        const types = request.input('types');
        if (types && types.length) {
            query.whereIn('i.institution_type_id', types);
        }

        const district = request.input('district');
        if (district) {
            query.where('j.district_id', district);
        }

        const thana = request.input('thana');
        if (thana) {
            query.where('j.thana_id', thana);
        }

        const position = request.input('position');
        if (position) {
            query.where('j.position_id', position);
        }

        const salaryFrom = request.input('salary_from', 0);
        const salaryTo = request.input('salary_to');

        if (!salaryTo) {
            query.where('j.salary_to', '>=', salaryFrom);
        } else {
            query.whereBetween('j.salary_to', [salaryFrom, salaryTo]);
        }

        const keyword = request.input('keyword');

        if (keyword) {
            const keywords = keyword.trim().split(' ').join('|');
            const cols = ['p.name', 'j.responsibilities', 'j.additional', 'j.village', 'd.name', 't.name', 'u.name'];

            let conditions = '';

            cols.forEach((col, index) => {
                conditions += `${col} regexp ?`;

                if (index !== cols.length - 1) {
                    conditions += ' or ';
                }
            });

            query.whereRaw(`(${conditions})`, new Array(cols.length).fill(keywords));
        }

        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 8));

        /*const data =*/
        return await query.paginate(page, perPage);

        // return new Array(perPage).fill(data.rows[0])
    }

    async index({request, response}) {
        const validation = await validate(request.only(['perPage']), {
            perPage: 'integer|max:30'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        // TODO: Show only approved

        return await db.select(
            'jobs.id',
            'experience_from',
            'experience_to',
            'salary_from',
            'salary_to',
            'education',
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
            .leftJoin('file_user', 'jobs.user_id', 'file_user.user_id')
            .leftJoin('files', 'file_user.file_id', 'files.id')
            .limit(request.input('perPage', 10));
    }

    async show({request, params, response, auth}) {
        const user = await auth.user();

        if (user.type === 3 && (user.permissions.includes('all') || user.permissions.includes('job-requests'))) {
            const job = await db.raw(`
              select j.id,
                     j.user_id,
                     concat(j.village, ', ', t.name, ', ', d.name) as location,
                     j.vacancy,
                     j.responsibilities,
                     j.additional,
                     j.education,
                     j.age_from,
                     j.age_to,
                     j.experience_from,
                     j.experience_to,
                     j.negotiable,
                     case j.nature
                       when 1 then 'ফুল টাইম'
                       when 2 then 'পার্ট টাইম'
                       end                                         as nature,
                     j.salary_from,
                     j.salary_to,
                     j.deadline,
                     j.created_at,
                     case j.gender
                       when 1 then 'পুরুষ অথবা মহিলা'
                       when 2 then 'পুরুষ'
                       when 3 then 'মহিলা'
                       end                                         as gender,
                     f.name                                        as logo,
                     u.name                                           institute,
                     p.name                                        as position
              from jobs j
                     join positions p on j.position_id = p.id
                     join districts d on j.district_id = d.id
                     join thanas t on j.thana_id = t.id
                     join users u on j.user_id = u.id
                     left join file_user fu on u.id = fu.user_id
                     left join files f on fu.file_id = f.id
              where j.id = ?
            `, [params.id]);

            if (job[0].length) {
                return job[0][0];
            }
        }

        const job = await db.raw(`
          select j.id,
                 j.user_id,
                 concat(j.village, ', ', t.name, ', ', d.name) as location,
                 j.vacancy,
                 j.responsibilities,
                 j.additional,
                 j.education,
                 j.age_from,
                 j.age_to,
                 j.experience_from,
                 j.experience_to,
                 j.negotiable,
                 case j.nature
                   when 1 then 'ফুল টাইম'
                   when 2 then 'পার্ট টাইম'
                   end                                         as nature,
                 j.salary_from,
                 j.salary_to,
                 j.deadline,
                 j.created_at,
                 case j.gender
                   when 1 then 'পুরুষ অথবা মহিলা'
                   when 2 then 'পুরুষ'
                   when 3 then 'মহিলা'
                   end                                         as gender,
                 f.name                                        as logo,
                 u.name                                           institute,
                 p.name                                        as position
          from jobs j
                 join positions p on j.position_id = p.id
                 join districts d on j.district_id = d.id
                 join thanas t on j.thana_id = t.id
                 join users u on j.user_id = u.id
                 left join file_user fu on u.id = fu.user_id
                 left join files f on fu.file_id = f.id
          where j.id = ?
            and j.approved = 1
        `, [params.id]);

        if (job[0].length) {
            return job[0][0];
        }

        return response.status(404).send('');
    }
}

module.exports = JobFilterController;
