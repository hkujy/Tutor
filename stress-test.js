const autocannon = require('autocannon');

async function runStressTest() {
  console.log('🚀 Starting Stress Test on Localhost:3000...');

  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 50, // Number of concurrent connections
    duration: 10,    // Duration in seconds
    pipelining: 1,   // Number of pipelined requests
    workers: 4,      // Number of worker threads
    title: 'Tutoring Calendar Homepage Load Test'
  });

  console.log('✅ Stress Test Completed!');
  console.log(autocannon.printResult(result));
}

runStressTest();
