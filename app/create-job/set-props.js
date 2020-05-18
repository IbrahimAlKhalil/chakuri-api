module.exports = function (job, data) {
  const booleans = ['negotiable', 'special'];

  booleans.forEach(item => {
    data[item] = data[item] ? 1 : 0;
  });

  for (const key in data) {
    if (!data.hasOwnProperty(key)) {
      continue;
    }
    job[key] = data[key];
  }
}
