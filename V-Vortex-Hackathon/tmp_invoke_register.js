const https = require('https');
const data = JSON.stringify({
  isVitChennai: 'yes',
  eventHubId: null,
  leaderName: 'Test Leader',
  leaderReg: '12345',
  leaderEmail: 'test-invocation@example.com',
  receiptLink: 'https://example.com/receipt'
});

const options = {
  hostname: 'zmcrdozxxclgzpltwpme.supabase.co',
  path: '/functions/v1/register-team',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptY3Jkb3p4eGNsZ3pwbHR3cG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzUwOTksImV4cCI6MjA4MDYxMTA5OX0.ecoF_ZdT19cpuu41OkR_lFI27yKMA1ZAtl3d2Z2AAnc'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});

req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
