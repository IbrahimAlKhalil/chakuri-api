const adminJobRules = require('./admin-job-rules');
const defaultRules = require('./default-rules');
const setProps = require('./set-props');
const {validate} = use('Validator');
const notify = require('./notify');
const Job = use('App/Models/Job');

module.exports = async function (
  request,
  response,
  user,
  approved = false,
  adminJob = false
) {
  const rules = adminJob ? {...defaultRules, ...adminJobRules} : defaultRules;

  const data = request.only(
    Object.keys(rules),
  );

  const validation = await validate(data, rules);

  if (validation.fails()) {
    return false;
  }

  data.user_id = user.id;
  data.approved = Number(approved);
  data.admin_job = Number(adminJob);

  const job = new Job;

  // Correct boolean values
  setProps(job, data);

  // Save job
  await job.save();

  // Notify moderators
  await notify(job, user);

  return job.id;
}
