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
Source to "GitHub Actions". If you fork this to a different repo name, update `base`
in `vite.config.ts` to match (`/your-repo-name/`), or set it to `/` if you're hosting
at the root of a custom domain or a `username.github.io` repo.

## How collaboration works

Each canvas is a [Yjs](https://github.com/yjs/yjs) document, persisted locally in
IndexedDB. Sharing a tab starts a
[y-webrtc](https://github.com/yjs/y-webrtc) connection using a random room id and
password, both encoded only in the URL fragment (after the `#`), so nothing sensitive
is ever sent to a server. Peers find each other through a public signaling server by
default; the actual drawing data flows directly between browsers over WebRTC, not
through the signaling server.

Known limitation: the public signaling servers don't include a TURN server, so peers
behind some restrictive NATs may fail to connect directly. If you run into this, or
want more reliable connections for your own deployment, self-host the signaling
server that ships with `y-webrtc` (`npx y-webrtc-signaling`) and point this app at it
by editing `SIGNALING_SERVERS` in `src/collab/YDocManager.ts`, optionally paired with
a TURN server.

Stopping and re-sharing a tab issues a new link. The old link stops syncing new
changes, which is the only real way to revoke access in a serverless P2P setup.

## Tech stack

React, TypeScript, Vite, and Yjs. No UI framework beyond React, no canvas library
(drawing is hand-rolled Canvas 2D), no backend. See the dependency list in
`package.json` for the full (short) list.

## License

MIT, see [LICENSE](LICENSE).
