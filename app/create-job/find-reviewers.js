const {moderators: getModerators} = require('../helpers');

module.exports = async function (exclude, adminJob) {
  const moderators = await getModerators();

  return moderators.filter(mod => {
    const {permissions} = mod;

    const excludeArr = Array.isArray(exclude) ? exclude : [exclude];

    if (excludeArr.includes(mod.id)) {
      return false;
    }

    if (mod.admin || permissions.includes('all')) {
      return true;
    }

    if (adminJob) {
      return permissions.includes('review-admin-job');
    }

    return permissions.includes('post-job');
  });
}
