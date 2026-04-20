const https = require('https')

exports.handler = async (event) => {
  const studyId = event.queryStringParameters?.study_id
  if (!studyId) return { statusCode: 400, body: 'study_id requerido' }

  const auth = Buffer.from(`${process.env.MB_USER}:${process.env.MB_PASS}`).toString('base64')
  const url = `https://www.movebank.org/movebank/service/direct-read?entity_type=event&study_id=${studyId}&max_events_per_individual=200&attributes=timestamp,location_lat,location_long,individual_local_identifier`

  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Access-Control-Allow-Origin': '*'
          },
          body: data
        })
      })
    })
    req.on('error', (e) => resolve({ statusCode: 500, body: e.message }))
  })
}
