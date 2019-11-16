'use strict';

const db = use('Database');
const {validate} = use('Validator');
const User = use('App/Models/User');

class ModeratorController {
    async index({request, response}) {

        const {validateIndex, buildSearchQuery, paginate} = require('../../../../helpers');

        if (!(await validateIndex(request, ['show'], {show: 'in:enabled,disabled'}))) {
            return response.status(422).send();
        }


        const query = db.query();

        query.from('users as u')
            .distinct()
            .select('u.id', 'user_type_id', 'f.name as photo', 'mobile', 'email', 'u.name', 'disabled')
            .leftJoin('files as f', 'u.photo', 'f.id')
            .where('user_type_id', 3);

        const show = request.input('show');

        if (show) {
            query.where('disabled', show === 'disabled' ? 1 : 0);
        }

        await buildSearchQuery(request, ['u.name', 'r.name', 'email', 'mobile'], query, query => {
            query.leftJoin('role_user as ru', 'u.id', 'ru.user_id')
                .leftJoin('roles as r', 'ru.role_id', 'r.id');
        });

        const pagination = await paginate(request, query);

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
            item.roles = roles.filter(role => role.userId === item.id)
                .map(item => ({id: item.id, name: item.name}));
        });

        return pagination;
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

        const {generateVerification, sendSMS, addModerator} = require('../../../../helpers');

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
        await addModerator({
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

    async update({request, params, response}) {
        const data = request.only(['roles']);

        const validation = await validate(data, {
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

        // Get current roles

        const roles = await db.query()
            .select('r.id')
            .from('roles as r')
            .join('role_user as ru', 'r.id', 'ru.role_id')
            .where('ru.user_id', params.id);

        const oldRoleIds = roles.map(role => role.id.toString());

        const shouldBeRemoved = oldRoleIds.filter(id => !data.roles.includes(id));
        const shouldBeAdded = data.roles.filter(id => !oldRoleIds.includes(id));

        if (!shouldBeAdded.length && !shouldBeRemoved.length) {
            return false;
        }

        // remove
        await db.query()
            .from('role_user')
            .whereIn('role_id', shouldBeRemoved)
            .where('user_id', params.id)
            .delete();

        // Insert
        await db.from('role_user').insert(shouldBeAdded.map(role => ({
            role_id: role,
            user_id: params.id
        })));

        return '';
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

        const roles = await db.query()
            .from('role_user')
            .where('user_id', params.id);


        if (roles.some(role => role.role_id === 1)) {
            // No body can remove admin
            return response.status(422).send();
        }


        const {removeModerator, addModerator} = require('../../../../helpers');

        if (user.disabled) {
            // Get permissions
            const permissions = await db.query()
                .from('permissions as p')
                .distinct('name')
                .join('role_permission as rp', 'p.id', 'rp.permission_id')
                .whereIn('rp.role_id', roles.map(role => role.role_id));

            // Cache moderator
            await addModerator({
                id: user.id,
                permissions: permissions.map(p => p.name)
            });
        } else {
            await removeModerator(user.id);
        }

        await User.query()
            .update({
                disabled: !user.disabled
            })
            .where('id', user.id);

        return '';
    }
}

module.exports = ModeratorController;
