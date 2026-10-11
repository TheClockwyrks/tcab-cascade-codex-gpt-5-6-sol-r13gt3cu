# Cascade

Cascade is a browser implementation of draw-three Klondike solitaire. Build alternating-color columns downward, uncover hidden cards, and move every suit from Ace through King to the foundations. Finishing triggers a bouncing-card celebration.

## Run locally

```sh
npm ci
npm run dev
```

Open the address printed by Vite. `npm run build` creates the static production site in `dist/`.

## Controls

- Click or tap the stock to deal three cards; click it empty to recycle.
- Drag an exposed card or ordered run. Columns build down in alternating colors; only a King fills an empty column.
- Drag cards to foundations, or double-click an exposed tableau or waste card to send it home.
- Use `NEW GAME`, `MENU`, and `SOUND`. Menus also support arrows or W/S, Enter/Space, and Escape.
- Press backtick for diagnostics.
