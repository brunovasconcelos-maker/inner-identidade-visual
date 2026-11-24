# inner-identidade-visual

## Project
Brand Identity module for the Inner AI platform. Users organize brand assets (Logo, Icon, Color Palette, Typography, Elements, and more) and generate an internal brand site.

Stack: React + Vite + react-router-dom (HashRouter), deployed to GitHub Pages at base `/inner-identidade-visual/`.

Data: identities and their files persist in IndexedDB (`src/storage/db.js`). localStorage is only read once to migrate older data.

## Permanent rules

- **Figma is the single source of truth.** Match logos, colors, font sizes, weights, line heights, spacing, radii and shadows exactly. Use `get_design_context` for each screen and each state separately.
- **Fonts:** Inter is the only font family. When Figma uses SF Pro, use Inter with the mapped weight (SF Pro Medium 510 to 500, SF Pro Regular to 400). Keep sizes, line heights and letter spacing from Figma.
- **Icons:** only `@phosphor-icons/react`. Use the exact icon and weight (Regular or Fill) shown in Figma. Component names must match the Figma layer names.
- **Desktop only.** Base 1440px, content max-width 1132px centered (use `PageContainer`).
- **Visual first, functionality later.** Build the static UI first, add interactivity only when asked.
- **Never substitute a missing asset, icon or font with a placeholder silently.** Stop and report exactly what is missing.
- **Disabled buttons** share one variant: background #efefef, text #798282, cursor not-allowed, no hover.
- **Never use em dashes** in any UI text.
- **Font weight names follow the market standard (e.g. Light 300 Italic), as an exception to sentence case.**
- **If something in the design is unclear, ask before assuming.**
