## Connection Inspector

A small, mobile-friendly Nuxt 3 + TypeScript + Tailwind app that shows your current connection and browser details, inspired by [`deviceinfo.me`](https://www.deviceinfo.me/) and powered by [`ipapi.is`](https://api.ipapi.is/).

### Tech stack

- **Nuxt 3** with **TypeScript**
- **Tailwind CSS** with a shadcn-style dark UI
- Client-side fetch to **`https://api.ipapi.is/`** for IP and network enrichment

### Running the app

From the project root:

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:3000`) in your browser. All detection is done in the browser; no data is stored.


