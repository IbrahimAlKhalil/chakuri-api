'use strict';

const db = use('Database');
const Helpers = use('Helpers');

class FileController {

    async show({params, auth, response}) {
        const file = await db.select('name', 'file_type_id', 'user_id')
            .from('files')
            .join('file_user', 'file_user.file_id', 'files.id')
            .where('files.id', params.id)
            .first();

        if (!file) {
            return response.status(404).send();
        }

        switch (file.file_type_id) {
            // Profile pic
            case 1:
                return response.download(Helpers.publicPath(`files/${file.user_id}/${file.name}`));
        }
    }
}

module.exports = FileController;
