const business = require('./business.js')

async function run() {
  try {
    const details = await business.getPhotoDetails(54781)
    console.log('getPhotoDetails(54781) ->')
    console.log(details)
    console.log('formatDate ->', business.formatDate('2025-01-05T19:45:00'))
    console.log('Smoke test completed successfully')
  } catch (e) {
    console.error('Smoke test failed', e)
    process.exit(1)
  }
}

run()
