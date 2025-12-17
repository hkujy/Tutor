// const fetch = require('node-fetch'); // Native fetch is available in Node 18+

// Simple polyfill if node-fetch isn't available (Node 18+ has global fetch)
const myFetch = global.fetch;

async function testRateLimit() {
  console.log('🛡️ Testing Rate Limiting on /api/health ...');
  
  const url = 'http://localhost:3000/api/health';
  const requests = 120; // Middleware limit is 100 per minute
  let blockedCount = 0;
  let successCount = 0;

  console.log(`Sending ${requests} requests rapidly...`);

  const promises = [];
  for (let i = 0; i < requests; i++) {
    promises.push(
      myFetch(url).then(res => {
        if (res.status === 429) {
          blockedCount++;
        } else if (res.status === 200) {
          successCount++;
        }
        return res.status;
      }).catch(err => console.error(err))
    );
  }

  await Promise.all(promises);

  console.log('--------------------------------');
  console.log(`✅ Success (200 OK): ${successCount}`);
  console.log(`⛔ Blocked (429 Too Many Requests): ${blockedCount}`);
  
  if (blockedCount > 0) {
    console.log('✅ Rate limiting is WORKING.');
  } else {
    console.log('⚠️ Rate limiting might NOT be active or threshold not reached.');
  }
}

testRateLimit();
