module.exports = {
  position_id: 'required|integer|exists:positions,id',
  vacancy: 'max:9999999',
  salary_from: 'max:999999999999',
  salary_to: 'max:99999999999',
  negotiable: 'boolean',
  special: 'boolean',
  nature: 'in:1,2',
  responsibilities: 'string|max:5000',
  get deadline() {
    return `required|date|after:${new Date(Date.now() + 4.32e+7)}`;
  },
  district_id: 'required|integer|exists:districts,id',
  thana_id: 'required|integer|exists:thanas,id',
  village: 'required|string|max:150',
  experience_from: 'integer|max:9999999',
  experience_to: 'max:9999999',
  education: 'max:500',
  gender: 'in:1,2,3',
  age_from: 'max:999999999',
  age_to: 'max:999999999',
  additional: 'string|max:5000',
};
