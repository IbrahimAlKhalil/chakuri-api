const findReviewers = require('./find-reviewers');
const io = require('../../start/socket');
const {notify} = require('../helpers');
const db = use('Database');

module.exports = async function (job, user) {
  const moderators = await findReviewers(user.id);

  // Get position
  const extraInfo = await db.query()
    .select('p.name as position', 'd.name as district', 't.name as thana')
    .from('jobs as j')
    .join('positions as p', 'p.id', 'j.position_id')
    .join('districts as d', 'd.id', 'j.district_id')
    .join('thanas as t', 't.id', 'j.thana_id')
    .where('j.id', job.id)
    .first();

  const object = {
    id: job.id,
    salary_from: job.salary_from,
    salary_to: job.salary_to,
    institute: user.name,
    logo: user.photoId,
    position: extraInfo.position,
    deadline: job.deadline,
    experience_from: job.experience_from,
    experience_to: job.experience_to,
    created_at: job.created_at,
    thana: extraInfo.thana,
    district: extraInfo.district,
    special: job.special,
    focus: true,
    how_to_apply: job.how_to_apply,
    institute_name: job.institute_name
  };

  for (const moderator of moderators) {
    const room = io.to(`u-${moderator.id}`);

    // Send job to the moderators realtime
    room.emit('nj', object);
  }

  await Promise.all([
    moderators.map(moderator => notify({
      user_id: moderator.id,
      title: 'বিজ্ঞাপনের আবেদন,',
      message: user.name,
      link: JSON.stringify({
        type: 'new-job',
        id: job.id,
      }),
      pic: user.photoId,
      seen: false,
    }))
  ]);
}
