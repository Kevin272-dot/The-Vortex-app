const https = require('https');

const ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptY3Jkb3p4eGNsZ3pwbHR3cG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzUwOTksImV4cCI6MjA4MDYxMTA5OX0.ecoF_ZdT19cpuu41OkR_lFI27yKMA1ZAtl3d2Z2AAnc`;
const hostname = 'zmcrdozxxclgzpltwpme.supabase.co';
const email = encodeURIComponent('test-invocation@example.com');

const options = {
  hostname,
  path: `/rest/v1/teams?lead_email=eq.${email}`,
  method: 'GET',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      console.log('BODY', JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log('BODY', body);
    }
  });
});

req.on('error', (e) => console.error('Request error', e));
req.end();
