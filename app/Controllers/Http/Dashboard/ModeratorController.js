'use strict';

const db = use('Database');
const {validate} = use('Validator');
const User = use('App/Models/User');

class ModeratorController {
    async index({request, response}) {
        const validation = await validate(request.only(['perPage', 'page', 'take']), {
            perPage: 'integer|max:30',
            page: 'integer|min:1',
            take: 'integer|max:30'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 6));

        const pagination = await db.table('users')
            .where('user_type_id', 3)
            .paginate(page || 1, perPage);

        const take = request.input('take', perPage);

        pagination.data = pagination.data.slice(pagination.data.length - take, pagination.data.length);

        // Load roles and permissions
        const roles = await db.query()
            .select(
                'r.id',
                'r.name',
                'ru.user_id as userId'
            )
            .from('role_user as ru')
            .join('roles as r', 'ru.role_id', 'r.id')
            .whereIn('ru.user_id', pagination.data.map(item => item.id));

        pagination.data.forEach(item => {
            const indexes = [];

            item.roles = roles.filter((role, index) => {
                if (role.userId === item.id) {
                    indexes.push(index);
                }

                return role.userId === item.id;
            }).map(item => ({id: item.id, name: item.name}));

            indexes.forEach(index => roles.slice(index, 1));
        });

        return pagination;
    }

    async count() {
        return await db.table('users')
            .where('user_type_id', 3)
            .count('id as count')
            .first();
    }

    async store({request, response}) {
        const data = request.only(['password', 'name', 'mobile', 'roles']);

        const validation = await validate(data, {
            password: 'required|min:8',
            name: 'required|string|max:190',
            mobile: 'required|uniqueUserMobile:3',
            roles: 'required|array'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        if (!data.roles.length || data.roles.includes('1')) {
            // At least one role should be selected
            // There can only be one admin
            return response.status(422).send();
        }

        const {generateVerification, sendSMS, addModerator} = require('../../../helpers');

        // Create user
        const user = await User.create(
            {
                ...request.only(['mobile', 'password', 'name']),
                user_type_id: 3
            }
        );

        // Add roles
        await db.from('role_user')
            .insert(
                data.roles.map(role => ({
                    user_id: user.id,
                    role_id: role
                }))
            );

        // Get permissions
        const permissions = await db.query()
            .from('permissions as p')
            .distinct('name')
            .join('role_permission as rp', 'p.id', 'rp.permission_id')
            .whereIn('rp.role_id', data.roles.map(id => id));

        // Cache moderator
        addModerator({
            id: user.id,
            permissions: permissions.map(p => p.name)
        });

        // Generate verification token
        const verification = await generateVerification(user.id, 'mobile', data.mobile, false, Math.floor(100000 + Math.random() * 900000));


        // // Send verification code
        await sendSMS(data.mobile, `Your verification code from Khidmat is ${verification.token}`);


        // Load roles and permissions
        const roles = await db.query()
            .select(
                'r.id',
                'r.name',
                'ru.user_id as userId'
            )
            .from('role_user as ru')
            .join('roles as r', 'ru.role_id', 'r.id')
            .where('ru.user_id', user.id);

        user.roles = roles.map(item => ({id: item.id, name: item.name}));

        return user;
    }

    async destroy({params, response, auth}) {

        if (params.id === auth.id) {
            return response.status(422).send();
        }

        // Check existence
        const user = await User.query()
            .where('user_type_id', 3)
            .where('id', params.id)
            .first();

        if (!user) {
            // User doesn't exist
            return response.status(422).send();
        }

        const admin = await db.query()
            .from('role_user')
            .where('role_id', 1)
            .where('user_id', params.id)
            .first();


        if (admin) {
            // No body can remove admin
            return response.status(422).send();
        }


        await User.query()
            .update({
                disabled: 1
            })
            .where('id', user.id);

        return '';
    }
}

module.exports = ModeratorController;
