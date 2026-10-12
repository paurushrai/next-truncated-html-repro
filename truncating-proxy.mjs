// Sits in front of `next start` and ends the HTML response for `/` early, as a
// dropped connection or a meddling middlebox would. The response still ends
// cleanly, so the browser parses what arrived and fires DOMContentLoaded.
import http from 'node:http'

const UPSTREAM = 'http://localhost:3000'
const PORT = 3001
const KEEP_FRACTION = Number(process.env.KEEP_FRACTION ?? '0.75')

http
  .createServer(async (req, res) => {
    const upstream = await fetch(UPSTREAM + req.url, { headers: { 'accept-encoding': 'identity' } })
    const type = upstream.headers.get('content-type') ?? ''
    let body = Buffer.from(await upstream.arrayBuffer())
    if (req.url === '/' && type.includes('text/html')) {
      const cut = Math.floor(body.length * KEEP_FRACTION)
      console.log(`/ : sending ${cut} of ${body.length} bytes`)
      body = body.subarray(0, cut)
    }
    res.writeHead(upstream.status, { 'content-type': type, 'cache-control': 'no-store' })
    res.end(body)
  })
  .listen(PORT, () => console.log(`truncating proxy on http://localhost:${PORT}`))
