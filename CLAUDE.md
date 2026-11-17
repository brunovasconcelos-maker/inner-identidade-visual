# inner-identidade-visual

## Project
Brand Identity module for the Inner AI platform. Users organize brand assets (Logo, Icon, Color Palette, Typography, Elements, and more) and generate an internal brand site.

Stack: React + Vite + react-router-dom (HashRouter), deployed to GitHub Pages at base `/inner-identidade-visual/`.

## Permanent rules

- **Figma is the single source of truth.** Match logos, colors, font sizes, weights, line heights, spacing, radii and shadows exactly. Use `get_design_context` for each screen and each state separately.
- **Icons:** only `@phosphor-icons/react`. Use the exact icon and weight (Regular or Fill) shown in Figma. Component names must match the Figma layer names.
- **Desktop only.** Base 1440px, content max-width 1132px centered (use `PageContainer`).
- **Visual first, functionality later.** Build the static UI first, add interactivity only when asked.
- **Never substitute a missing asset, icon or font with a placeholder silently.** Stop and report exactly what is missing.
- **Never use em dashes** in any UI text.
- **If something in the design is unclear, ask before assuming.**
