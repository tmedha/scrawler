# scrawler

Draw, take notes, and collaborate all in one place, all on the web; no download required.

An infinite-canvas whiteboard with a pen, eraser, shapes, arrows, a laser pointer, and
multiple renamable tabs, each its own canvas. Everything is saved locally in your
browser and reopens exactly as you left it. A tab can be shared as a link so someone
else can draw on it with you live, with no account or invite required.

## Features

- Infinite pan/zoom canvas with pen, eraser, line, arrow, rectangle, ellipse, and text
  tools, plus a select tool with move, resize, rotate, and multi-select.
- Adjustable stroke width and color, a laser pointer for pointing during a call, and
  find-on-canvas to search text and jump the camera to it.
- Up to 5000 shapes per canvas. Erase something to free up room once you hit the cap.
- Multiple tabs, each an independent canvas, renamable and persisted locally.
- Undo/redo, scoped so it never undoes a collaborator's edit.
- Download the current canvas as a PNG.
- Live collaboration over peer-to-peer WebRTC: share a link, no accounts, no backend
  to run.
- Runs entirely as a static site. No server required to self-host.

## Running locally

```
npm install
npm run dev
```

## Building

```
npm run build
```

Output goes to `dist/`. Serve it with any static file host.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on
every push to `main`. Enable it once in your repo under Settings > Pages, setting
Source to "GitHub Actions".

`vite.config.ts` sets `base: '/scrawler/'`, which matches this repo being served at
`username.github.io/scrawler/`. If you rename the repo, update `base` to match
(`/your-repo-name/`).

If you want to serve this from a custom domain or a `username.github.io` repo instead
of a project-page subpath, change `base` to `/`, and add a `public/CNAME` file
containing that domain (Vite copies it into `dist/` as-is on build, so it survives
redeploys). You'll also need to point the domain's DNS at GitHub Pages. See
[GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
for the exact records. Only do this once you actually own the domain and have set up
its DNS, since the site won't load at any URL correctly until both match.

## How collaboration works

Each canvas is a [Yjs](https://github.com/yjs/yjs) document, persisted locally in
IndexedDB. Sharing a tab starts a
[y-webrtc](https://github.com/yjs/y-webrtc) connection using a random room id and
password, both encoded only in the URL fragment (after the `#`), so nothing sensitive
is ever sent to a server. Peers find each other through a signaling server; the
actual drawing data flows directly between browsers over WebRTC, not through the
signaling server.

**The public signaling servers y-webrtc lists as defaults are unreliable in
practice** (some are long-dead free-tier Heroku apps), so collaboration needs a
signaling server that's actually reachable. `signaling-server/` in this repo is a
small, deployable copy of the one y-webrtc ships, with instructions for running it
free on Render. Deploy it, then add its URL to the front of `SIGNALING_SERVERS` in
`src/collab/YDocManager.ts` (`wss://your-service.onrender.com`). It only helps peers
find each other; it never sees drawing data.

Separately, peers behind some restrictive NATs may fail to connect directly since
there's no TURN server in the mix. That's a rarer edge case than the signaling
servers being down, and worth pairing with a TURN server only if you run into it.

Stopping and re-sharing a tab issues a new link. The old link stops syncing new
changes, which is the only real way to revoke access in a serverless P2P setup.

## Tech stack

React, TypeScript, Vite, and Yjs. No UI framework beyond React, no canvas library
(drawing is hand-rolled Canvas 2D), no backend. See the dependency list in
`package.json` for the full (short) list.

## License

MIT, see [LICENSE](LICENSE).
