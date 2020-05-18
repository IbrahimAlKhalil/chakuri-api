const adminJobRules = require('./admin-job-rules');
const defaultRules = require('./default-rules');
const setProps = require('./set-props');
const {validate} = use('Validator');
const notify = require('./notify');
const Job = use('App/Models/Job');
const db = use('Database');

module.exports = async function (
  request,
  response,
  jobId,
  user,
  approved = false,
  checkUser = true,
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

  const job = await Job.find(jobId);

  if (checkUser && job.user_id !== user.id) {
    return false;
  }

  // Set values
  setProps(job, data);

  // Make job unapproved
  job.approved = Number(approved);
  job.rejected = 0;

  // Update job
  await job.save();

  // Delete old job request
  await db.query()
    .from('rejected_jobs')
    .where('job_id', job.id)
    .delete();

  // Notify moderators
  await notify(job, user);

  return job.id;
}
