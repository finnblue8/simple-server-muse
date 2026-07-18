# simple-server-muse

A personal genealogy and family-history site, self-hosted on a home Linux server
(`brittonserver`) behind Nginx at `robertbritton.co`.

Built with **TanStack Start** (React 19 + Vite 7), originally scaffolded in
Lovable. Deployed as a **fully static prerendered site** — no Node process runs
in production.

---

## Stack

| Piece | What it is |
|---|---|
| TanStack Start / React Router | App framework and routing (file-based, `src/routes/`) |
| Vite 7 | Bundler |
| Nitro | Server build layer (`node-server` preset, used only at build time) |
| Tailwind 4 + Radix UI | Styling and components |
| Leaflet / react-leaflet | Maps (`/britton-map`) |

Routes: `/`, `/about`, `/britton-map`, `/britton-tree`.

---

## The important thing to understand

This is **not** a plain Vite SPA. A default `vite build` produces a client
bundle plus a **server-side render handler**, and **no `index.html`** — so you
cannot drop the build output into a web root and have it work.

It also has **no server-side logic**: no server functions, no loaders, no API
routes. Genealogy data is imported at build time; map tiles are fetched
client-side. That means the app *can* be made fully static — it just takes an
extra step.

That step is `prerender.mjs`: build a real Node server, boot it locally, fetch
every route, and save the rendered HTML. The result is a plain folder of files.

---

## Building

Requires Node and npm.

```bash
npm install
npm run build:static
```

Which runs:

```
vite build && node prerender.mjs
```

Output lands in **`.output/public/`** (note the leading dot — `ls` won't show
it without `-a`):

```
.output/public/
├── index.html          ← prerendered
├── about.html          ← prerendered
├── britton-map.html    ← prerendered
├── britton-tree.html   ← prerendered
├── assets/             ← hashed JS/CSS/images
├── fonts/
└── photos/
```

A successful run prints one line per route:

```
prerendered / -> .output/public/index.html (6895 bytes)
```

### Project files that make this work

These are **not** part of the stock Lovable project — they were added to enable
static hosting. Keep them in version control.

- **`vite.config.ts`** — sets the Nitro preset to `node-server` (the default
  targets Cloudflare Workers, which produces a Workers handler that can't be
  crawled).
- **`prerender.mjs`** — boots the built server on a local port, fetches each
  route in its `ROUTES` array, writes the HTML. Auto-detects `.output/` or
  `dist/` depending on the Nitro version.
- **`package.json`** — the `build:static` script.

> **Adding a page?** Add its path to the `ROUTES` array in `prerender.mjs`, or
> it won't get a prerendered HTML file. (It would still load via the
> `index.html` fallback, just without server-rendered initial markup.)

---

## Deploying

Copy the contents of `.output/public/` into your web server's root directory —
or a subfolder, if you'd rather serve the site from a path.

Make sure the copied files end up readable by the user your web server runs as.
If they don't, the server returns a 403, which the browser reports as a
confusing MIME-type error rather than a permission problem.

---

## Images

Two reference styles exist in this project:

1. **Normal** — `public/photos/foo.jpg` → served at `/photos/foo.jpg`. Files in
   `public/` are copied verbatim with no hashing. This is what you want.
2. **Lovable asset stubs** — `src/assets/*.asset.json` files containing a
   `"url"` pointing at `/__l5e/assets-v1/<uuid>/<name>`. This is Lovable's
   internal asset route. **It does not exist outside Lovable's hosting**, and
   the binaries were never in the repo — only the JSON pointers.

Nine images used this second style (Devon/English ancestry photos and the Erie
Canal): `westdown.jpg`, `lynton.jpg`, `ilfracombe.jpg`, `ilfracombe2.jpg`,
`barnstaple.webp`, `brattonfleming.jpg`, `brattonfleming2.jpg`, `eleanora.png`,
`eriecanal.gif`. They were resolved by placing the actual files in
`public/photos/` and pointing the references at that path instead.

Filenames are **case-sensitive** on Linux even where Lovable's CDN was not.

---

## License

Released under the [MIT License](LICENSE).

Copyright (c) 2026 Robert Britton

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

**Note:** the MIT license covers the source code in this repository. Images,
photographs, and genealogical content under `public/photos/` and `src/data/`
are not necessarily covered — several are sourced from third parties with their
own terms. Review those separately before redistributing.
