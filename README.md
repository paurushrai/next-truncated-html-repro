# Truncated HTML leaves an App Router page unhydrated, with an unhandled rejection

Minimal reproduction for a Next.js App Router bug, on `next@16.4.0` + `react@19.3.0`.

If the HTML document of a first load is cut off in transit (dropped connection,
flaky mobile network, a middlebox that ends the response early), the browser
still parses what arrived and fires `DOMContentLoaded`. Next closes the inline
Flight stream at that point, the Flight client rejects every row that never
arrived with `Connection closed.` (minified: React error #412), and `hydrate()`
rejects. Nothing catches that rejection, so:

- the page stays static HTML: no client component works until the visitor reloads
- the only signal is an `unhandledrejection` whose stack is two frames inside the
  Flight client, with nothing pointing at the cause

## Run it

```bash
npm install
npm run build
npm start          # next start on :3000
npm run proxy      # truncating proxy on :3001 (in a second terminal)
```

- Open http://localhost:3000: the button counts clicks (hydrated).
- Open http://localhost:3001: same page, but the proxy sends only the first 75%
  of the HTML for `/` (`KEEP_FRACTION` to change it). The button never responds,
  and the console shows
  `Uncaught (in promise) Error: Minified React error #412` (`Connection closed.`).

`truncating-proxy.mjs` is the whole trick: it forwards everything to `:3000` and
ends the `/` document early. The response still completes normally, which is what
the browser sees when a connection drops after the headers.

## Where it happens

- `packages/next/src/client/app-index.tsx`: `DOMContentLoaded` closes
  `initialServerDataWriter`; `hydrate()` does `await initialServerResponse`.
- `packages/next/src/client/app-next.ts`: `hydrate(...)` is called with no
  `await` / `.catch`, so the rejection is unhandled and nothing recovers the page.
