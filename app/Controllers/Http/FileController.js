'use strict';

const db = use('Database');
const Helpers = use('Helpers');

class FileController {

    async show({params, response}) {
        const file = await db.select('name')
            .from('files')
            .where('id', params.id)
            .first();

        if (!file) {
            return response.status(404).send();
        }

        return response.download(Helpers.publicPath(`files/${file.name}`));
    }
}

module.exports = FileController;
