'use strict';

const db = use('Database');
const Activity = use('App/Models/Activity');

class ActivityController {
    async notificationClick({auth}) {
        const activity = await Activity.query()
            .where('user_id', auth.id)
            .where('name', 'n-c')
            .first();

        if (activity) {
            activity.updated_at = Date.now();

            await activity.save();

            return;
        }

        await db.from('activities')
            .insert({
                user_id: auth.id,
                name: 'n-c'
            });
    }
}

module.exports = ActivityController;
