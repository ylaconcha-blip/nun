const https = require('https')

exports.handler = async () => {
  const url = 'https://www.submarinecablemap.com/api/v3/cable/cable-geo.json'

  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400'
          },
          body: data
        })
      })
    })
    req.on('error', (e) => {
      resolve({ statusCode: 500, body: e.message })
    })
  })
}
