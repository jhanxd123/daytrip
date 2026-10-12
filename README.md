# Daytrip

A desktop car-rental learning prototype with fictional inventory, car details, local SVG artwork, and Anime.js/Motion animation. Reservations and payments are not implemented.

## Run locally

Requires Python 3 and a modern browser. From this repository:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory app
```

Open http://localhost:8000. No package installation or build is required.

## GitHub Pages

In Settings → Pages, select GitHub Actions as the publishing source. Pushes to `main` deploy only `app/`. The expected address is https://jhanxd123.github.io/daytrip/ after the first successful deployment.

## Animation

Replay scene repeats the entrance. Pause/Resume controls all page motion; animations play regardless of system reduced-motion preferences, as requested for this prototype. Effects may differ by browser and device.

Pinned Anime.js and Motion bundles, MIT licences, and integrity metadata are in `app/vendor/`. The rest of the artwork and application code are local. No backend or external runtime service is required.
