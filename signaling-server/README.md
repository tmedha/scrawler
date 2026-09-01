# scrawler signaling server

A small WebSocket server that lets two browsers running scrawler find each other to
start a peer-to-peer WebRTC connection. It never sees or stores any drawing data;
drawings sync directly between browsers once they're connected. This is the same
signaling server [y-webrtc](https://github.com/yjs/y-webrtc) ships in its own
package, copied here so it can be deployed on its own.

The public signaling servers y-webrtc lists as defaults are unreliable (some are
long-dead free-tier Heroku apps), so scrawler needs a working one to actually
collaborate. Running your own fixes that.

## Deploying to Render (free tier)

1. Push this repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com), click New > Web Service
   and connect this repository.
3. Set:
   - Root Directory: `signaling-server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
4. Deploy. Render gives you a URL like `https://your-service.onrender.com`.
5. In `src/collab/YDocManager.ts`, add `wss://your-service.onrender.com` (note `wss`,
   not `https`) to the front of `SIGNALING_SERVERS`, then redeploy the main app.

The free tier sleeps after 15 minutes of no traffic. The first connection after a
lull takes 30-60 seconds to wake it up; after that it's instant until it sleeps
again.

## Running locally

```
cd signaling-server
npm install
npm start
```

Listens on `ws://localhost:4444` by default. Override with `PORT`.
