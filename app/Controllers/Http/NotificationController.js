'use strict';
const {validate} = use('Validator');
const Notification = use('App/Models/Notification');
const db = use('Database');

class NotificationController {
    async index({request, auth, response}) {
        const data = request.only(['page', 'perPage']);

        const validation = await validate(data, {
            page: 'required|integer|min:1',
            perPage: 'required|integer|min:1|max:50'
        });

        if (validation.fails()) {
            return response.status(422).send();
        }

        return await Notification
            .query()
            .select('notifications.id', 'message', 'link', 'f.name as pic', 'notifications.created_at', 'seen', 'title')
            .leftJoin('files as f', 'pic', 'f.id')
            .where('user_id', auth.id)
            .orderBy('notifications.created_at', 'DESC')
            .forPage(data.page, data.perPage)
            .fetch();
    }

    async unreadCount({request, auth}) {

        const data = await Notification
            .query()
            .leftJoin('activities', 'activities.user_id', 'notifications.user_id')
            .where('notifications.user_id', auth.id)
            .whereRaw('notifications.created_at >= activities.updated_at')
            .where('activities.name', 'n-c')
            .where('seen', 0)
            .count('notifications.id as count');

        return data[0].count;
    }

    async seen({params, auth}) {
        await db.query()
            .from('notifications')
            .update({
                seen: 1
            })
            .where('notifications.id', params.id)
            .where('user_id', auth.id);
    }
}

module.exports = NotificationController;
