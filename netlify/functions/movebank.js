const https = require('https')

exports.handler = async (event) => {
  const studyId = event.queryStringParameters?.study_id
  if (!studyId) return { statusCode: 400, body: 'study_id requerido' }
  
  const auth = Buffer.from(`${process.env.MB_USER}:${process.env.MB_PASS}`).toString('base64')
  const url = `https://www.movebank.org/movebank/service/direct-read?entity_type=event&study_id=${studyId}&max_events_per_individual=30&attributes=timestamp,location_lat,location_long,individual_local_identifier`
  
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        // parsear CSV y devolver solo coordenadas como JSON compacto
        const lineas = data.trim().split('\n')
        if (lineas.length < 2) {
          resolve({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: '[]' })
          return
        }
        const h = lineas[0].split(',').map(x => x.replace(/"/g,'').trim())
        const iLat = h.indexOf('location_lat')
        const iLon = h.indexOf('location_long')
        const iId  = h.indexOf('individual_local_identifier')
        if (iLat < 0 || iLon < 0) {
          resolve({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: '[]' })
          return
        }
        // agrupar por individuo
        const individuos = new Map()
        for (let i = 1; i < lineas.length; i++) {
          const c = lineas[i].split(',')
          const lat = parseFloat(c[iLat])
          const lon = parseFloat(c[iLon])
          const id  = c[iId]?.replace(/"/g,'') || 'x'
          if (isNaN(lat) || isNaN(lon)) continue
          if (!individuos.has(id)) individuos.set(id, [])
          individuos.get(id).push([parseFloat(lat.toFixed(4)), parseFloat(lon.toFixed(4))])
        }
        // convertir a array compacto
        const resultado = []
        individuos.forEach((puntos, id) => {
          if (puntos.length > 1) resultado.push({ id, puntos })
        })
        const body = JSON.stringify(resultado)
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400'
          },
          body
        })
      })
    })
    req.on('error', (e) => resolve({ statusCode: 500, body: e.message }))
  })
}
