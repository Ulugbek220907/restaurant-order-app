# Restaurant Live Order Board

Simple MVP: receives orders via a webhook (from Make) and displays them live on a webpage.

## What's inside
- `server.js` — small backend with two endpoints:
  - `POST /order` — Make sends new orders here
  - `GET /orders` — the webpage polls this every 3 seconds
- `public/index.html` — the live order board (auto-refreshes)

## Run locally
```
npm install
npm start
```
Then open http://localhost:3000

## Deploy (so Make can reach it from the internet)
Easiest free options:
- **Render.com** — connect this folder as a repo, "Web Service", build command `npm install`, start command `npm start`
- **Railway.app** — same idea, even faster to deploy
- **Replit** — paste the files in, click Run, it gives you a public URL

Once deployed, you'll get a public URL like `https://your-app.onrender.com`.

## Sending an order (what Make will do)
POST to `https://your-app-url/order` with JSON body:
```json
{
  "seat": "5",
  "items": ["2x Lag'mon", "1x Cola"],
  "waiter": "Aziz"
}
```
The order will appear instantly (within 3s) on the live board.
