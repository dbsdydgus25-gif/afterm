const https = require('https');
require('dotenv').config({ path: '.env.local' });

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models?key=' + process.env.GEMINI_API_KEY,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(json.models.map(m => m.name).filter(n => n.includes('flash')).join('\n'));
    } catch(e) {
      console.log(data);
    }
  });
});
req.end();
