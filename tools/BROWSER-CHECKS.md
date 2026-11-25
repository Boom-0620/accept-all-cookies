# Browser regression checks

Serve the parent of this repository over HTTP so `/accept-all-cookies/` resolves to the repository root. Install Playwright and its Chromium browser outside the deployed site. Run each `check-*.cjs` with Node.

Environment variables:

- `SITE_URL`: game URL, including trailing slash; default `http://127.0.0.1:5192/accept-all-cookies/cookie-quest/`.
- `CHROMIUM_EXECUTABLE`: optional Chromium executable path.
- `NODE_PATH`: optional directory containing the Playwright package.

The game checks operate real UI controls and verify completion handoff. `check-main-flow.cjs` deliberately uses developer checkpoints and child-frame completion messages to test main-story transitions and duplicate-message protection; it does not simulate a complete platform-level playthrough. Media checks play both films in full and include pause/resume and band image-failure recovery.

`browser-verification.json` records the tested environment, observed results and limitations. Local throttling results must not be presented as worldwide GitHub Pages performance or a Windows device test. These scripts do not publish changes.

`check-stalled-network.cjs` holds requests indefinitely (rather than returning an error), then checks explicit retry and optional-story fallback. `tools/build.py` generates the four versioned `host.html` startup pages from their original scripts, CSS and HTML before bundling the host.
