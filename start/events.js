const FormData = require('form-data');
const fetch = require('node-fetch');
const Event = use('Event');
const Env = use('Env');

Event.on('send-sms', async (payload) => {
  if (Env.get('NODE_ENV') === 'development') {
    return;
  }

  const body = new FormData;
  const data = {
    api_key: Env.get('SMS_API_KEY'),
    type: 'unicode',
    contacts: payload.mobile,
    senderid: Env.get('SMS_SENDER_ID'),
    msg: payload.message,
    method: 'api',
  };

  for (let key in data) {
    body.append(key, data[key]);
  }

  await fetch(`http://portal.smsinbd.com/smsapi`, {
    method: 'POST',
    body,
  });
})
