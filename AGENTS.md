After modifying cookie-quest JavaScript, rebuild the deployed host bundle with `python3 tools/build.py /path/to/esbuild` (esbuild 0.25.12). The website runs main.bundle.js; main.js and its imports remain the source. Commit the rebuilt bundle and updated index.html together. Do not hand-edit the bundle.

Run tools/optimize-assets.py with Pillow only when adding/changing source PNG assets. Original PNG files are retained for dynamic references and lossless sources. Keep atlas dimensions and color-keyed pixel values intact.

The build also regenerates modules/*/host.html startup pages and their versioned manifest entries. Edit original module scripts/styles/HTML, never the generated host.html files. Run tools/build.py after changing module sources and commit the generated pages and manifest together.
