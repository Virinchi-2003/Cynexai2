import { getMarketingMetrics, getMarketingCampaigns, updateMarketingMetrics } from './src/lib/api/marketing.js';
import { client } from './src/lib/turso.js';

async function runTests() {
  console.log('Running marketing API tests...');
  let failed = false;

  try {
    // RED: These should throw initially because marketing.js doesn't exist
    const metrics = await getMarketingMetrics();
    console.log('getMarketingMetrics passed', metrics);
    
    const campaigns = await getMarketingCampaigns();
    console.log('getMarketingCampaigns passed', campaigns);
  } catch (error) {
    console.error('Test Failed:', error.message);
    failed = true;
  }
  
  if (failed) {
    process.exit(1);
  } else {
    console.log('All tests passed!');
  }
}

runTests();
