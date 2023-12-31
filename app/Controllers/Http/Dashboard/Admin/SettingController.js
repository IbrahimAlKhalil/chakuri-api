'use strict';

const db = use('Database');
const Helpers = use('Helpers');
const {validate} = use('Validator');
const File = use('App/Models/File');

const rules = {
  minPassword: 'required|integer',
  logo: 'required|file|file_types:image',
  'banner': 'required|file|file_types:image',
  title: 'required|string|min:5',
  description: 'required|string|min:5',
  copyright: 'required|string|min:5',
  'special-job-info-page-link': 'required|string|min:5',
  'terms-and-conditions-page': 'required|string|min:5',
  'privacy-policy-page': 'required|string|min:5',
};

class SettingController {
  constructor() {
    this.table = 'settings';
  }

  async index() {
    return await db.table('settings');
  }

  async update({request, response, params, auth}) {

    const setting = await db.table(this.table)
      .where('id', params.id)
      .first();

    if (!setting) {
      return response.status(422).send('');
    }

    const data = {...request.only(['value']), ...request.files()};

    const validation = await validate(data, {
      value: rules[setting.name],
    });

    if (validation.fails()) {
      return response.status(422).send('');
    }

    if (setting.type === 'image') {
      return await this.handleFile({request, response, params, auth, setting});
    }


    let value;

    switch (setting.type) {
      case 'object':
        value = JSON.stringify(data.value);
        break;
      case 'number':
        value = Number(data.value);
        break;
      default:
        value = data.value;
    }


    await updateSetting(setting.name, value);

    await db.query()
      .from(this.table)
      .where('id', params.id)
      .update({value});
  }

  async handleFile({request, params, auth, setting}) {
    const photo = request.file('value');

    const file = new File;
    file.mime_type = photo.headers['content-type'];
    file.file_type_id = 4;
    await file.save();

    const name = `${file.id}.${photo.subtype}`;

    file.name = `settings/${name}`;

    const oldFile = await db.query()
      .from('files as f')
      .select('f.id')
      .join('file_types as ft', 'f.file_type_id', 'ft.id')
      .where('f.name', setting.value)
      .first();

    await db.table('file_user')
      .insert({
        user_id: auth.id,
        file_id: file.id,
      });

    // Delete previous file
    const Drive = use('Drive');

    if (oldFile) {
      await Promise.all([
        db.table('files')
          .where('id', oldFile.id)
          .delete(),
        Drive.delete(`files/settings/${oldFile.name}`),
      ]);
    }

    await photo.move(Helpers.publicPath(`files/settings`), {name, overwrite: true});


    await updateSetting(setting.name, `settings/${name}`);

    await db.query()
      .from(this.table)
      .where('id', params.id)
      .update({value: `settings/${name}`});

    return file.name;
  }
}

module.exports = SettingController;
