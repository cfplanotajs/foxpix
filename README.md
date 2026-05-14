# Foxpix CLI

A lightweight local TypeScript + Node.js batch image optimizer for web-production workflows. It bulk-renames files, converts to WebP, preserves transparency, and writes `manifest.json` and `manifest.csv` reports.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Typecheck

```bash
npm run typecheck
```

## Test

```bash
npm run test
```

## CLI usage

CLI processing writes both `manifest.json` and `manifest.csv` in the output folder (dry-run writes neither).

```bash
npm run optimize -- --input ./input [options]
npm run optimize -- --help
npm run optimize -- --version
```

Options:

- `--input` (required)
- `--output` (default: `<input>/optimized`)
- `--prefix`
- `--pattern` (default: `{prefix}-{index}`)
- `--custom`
- `--quality` (default: `85`)
- `--alphaQuality` (default: `100`)
- `--effort` (default: `4`, range `0..6`)
- `--lossless` (default: `false`)
- `--maxWidth`
- `--maxHeight`
- `--recursive` (default: `false`)
- `--dryRun` (default: `false`)
- `--keepMetadata` (default: `false`)

## Local QA sample set

```bash
npm run create-samples
```

Creates an idempotent local fixture set under `sample-input/` including:
- transparent PNG (alpha)
- opaque JPEG and PNG
- WebP input
- duplicate/slug-collision names
- punctuation/weird filename cases
- large image for resize tests
- nested folder images
- `sample-input/optimized/` with intentional output conflicts (`cute-cat.webp`, `weird-name.webp`).

### GUI smoke flow
1. Launch app.
2. Choose `sample-input`.
3. Preview.
4. Use **Renamed** filter.
5. Estimate Sizes.
6. Try global JPEG and observe transparent PNG warning/failure.
7. Try per-file Override format.
8. Process Included.
9. Confirm `manifest.json` and `manifest.csv`.

### CLI smoke commands
```bash
npm run optimize -- --input ./sample-input --prefix test --dryRun
npm run optimize -- --input ./sample-input --prefix test --format WEBP --dryRun
npm run optimize -- --input ./sample-input --prefix test --format PNG --dryRun
npm run optimize -- --input ./sample-input --prefix test --format JPEG --dryRun
```

## Examples

```bash
npm run optimize -- --input ./input --prefix animal-habitat
npm run optimize -- --input ./input --output ./optimized --prefix sticker --quality 85 --alphaQuality 100
npm run optimize -- --input ./input --pattern "{prefix}-{name}-{index}" --prefix product
npm run optimize -- --input ./input --dryRun
```

## Rename patterns

Supported tokens:

- `{index}` (`001`, `002`, ...)
- `{name}`
- `{prefix}`
- `{folder}`
- `{custom}`

Collision-safe filenames are auto-suffixed (`-2`, `-3`, ...).

## Supported input types

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.tiff`
- `.tif`
- `.avif`

## Transparency preservation notes

- The pipeline does **not** call `flatten()`.
- No background color is applied.
- Sharp writes WebP directly from source alpha channels.

Manual transparency check:

1. Run optimization on a transparent PNG.
2. Open the output WebP in a browser or image editor with checkerboard support.
3. Verify transparent areas remain transparent (not replaced with white/black).

## Local validation checklist

```bash
npm install
npm run create-samples
npm run optimize -- --input ./sample-input --prefix test --dryRun
npm run optimize -- --input ./sample-input --prefix test
npm run typecheck
npm run test
npm run build
```



## Development security notes

- Dev dependencies are pinned to a current Vitest line (`^3.2.4`) to pull a newer Vite/esbuild chain and reduce audit risk in the test toolchain.
- Avoid running `npm audit fix --force` blindly; prefer intentional upgrades and verify with `npm audit` and tests.

## Exit codes (automation)

- `0`: run completed successfully (or dry run planned successfully)
- `1`: one or more files failed during processing, or a fatal CLI/setup error occurred

## Recommended settings for web images

WebP effort controls encoding speed/size tradeoff (0 fastest, 6 slower/smaller).

- `quality: 85`
- `alphaQuality: 100`
- `effort: 4` (0 fastest, 6 smaller/slower)
- `lossless: false`
- `keepMetadata: false`

## Troubleshooting

- **Input folder error**: verify path exists and is a directory.
- **No files found**: ensure supported extensions are present.
- **Unexpected names**: validate `--pattern` tokens and `--prefix/--custom` values.
- **Large files after conversion**: try lower quality or enable resizing.


## GUI (Electron + React) MVP

The GUI is a local shell over the existing core pipeline. Processing stays in Electron's main process and the renderer uses a narrow preload/IPC bridge (`window.foxpix.*`).

### GUI development

```bash
npm run dev:gui
```

This launches the Electron desktop app in development mode (Vite renderer + Electron main/preload), not just a browser tab.

### GUI build

```bash
npm run build:gui
```

### GUI start (after build)

```bash
npm run start:gui
```

### Output format (GUI)

- WebP is the default and recommended format.
- AVIF may be smaller but slower to encode.
- JPEG is best for non-transparent photos.
- PNG is lossless and transparency-safe.
- JPEG does not support transparency; FoxPix blocks transparent files instead of flattening them.

### Selective processing

- Uncheck preview rows to skip files in the current run.
- Estimate Sizes and Process apply only to included rows.
- Skipped rows are not written and are not included in manifests.

### Preview Studio

- Click a preview row to inspect that image.
- Use **Generate Preview** to render side-by-side original and optimized visual previews.
- Transparent assets are shown on a checkerboard background for visual alpha checks.
- Preview Studio is for visual confidence; processing + manifests remain the final source of truth.

### Estimate Sizes

- Preview shows planned output names and formats.
- **Estimate Sizes** runs in-memory optimization estimates only.
- Estimation does **not** write output files or manifests.
- Actual processed sizes can differ slightly; final processing summary is the source of truth.

### Per-file format overrides

- Global output format still applies by default to all rows.
- In Preview, each row can override target format (WebP/AVIF/JPEG/PNG) or follow global.
- Mixed folders can be processed with mixed targets in one run.
- Estimate Sizes and Process both respect row overrides.
- Skipped rows are not estimated or processed.
- JPEG does not support transparency; transparent JPEG-target rows fail individually with a clear message.

### Review controls

- Use Preview filters (**All / Included / Skipped / Overrides / Warnings / Errors**) to review large batches quickly.
- Bulk format controls apply to **included rows only**.
- Skipped rows are not processed.
- Warning/error views help catch JPEG transparency issues before processing.
- Preview table thumbnails are generated locally in Electron for visual review and are not written to disk.

### GUI workflow

1. Add source.
2. Pick preset and output format.
3. Preview web-safe names.
4. Review warnings and per-file overrides.
5. Estimate Sizes.
6. Inspect images in Preview Studio.
7. Process Included.
8. Open output folder and manifests.

### GUI shortcuts

- `Ctrl+O`: Choose Folder
- `Ctrl+Shift+O`: Choose Image File(s)
- `Ctrl+P`: Preview
- `Ctrl+E`: Estimate Sizes
- `Ctrl+Enter`: Process Included
- `Esc`: Clear Preview Studio preview

### Custom presets

- Save your current tuning as a **Custom preset** from the settings panel.
- Presets include workflow settings (format, naming, quality, alpha quality, effort, resize, lossless, metadata, recursive).
- Presets do **not** include source/output folders, selected files, preview rows, or per-row include/override state.
- Custom presets are stored locally on this computer and can be renamed or deleted in-app.

### Output preflight diagnostics

- Preview checks planned output names and writes no files.
- FoxPix prevents overwrites by adjusting conflicting names with safe suffixes (`-2`, `-3`, ...).
- Conflicts can come from duplicate planned names in the current batch or existing files already in the output folder.
- Use the **Renamed** review filter to inspect rows that were adjusted for safety before processing.
- Preview also checks output folder readiness (exists / will-create / invalid path).
- If output folder is missing, FoxPix creates it during Process.
- If output path is a file or inaccessible, processing is blocked with a readable error.
- Manifest JSON and CSV include rename diagnostic fields for suffixed/adjusted outputs.

### Actionable recommendations

- Smart Recommendations are deterministic and local-only.
- Some recommendations include quick actions (for example Estimate Sizes, Show Renamed filter, safer pattern updates).
- Mutating recommendation actions support one-step undo.
- Quick actions do not upload files and do not write optimized outputs by themselves.
- **Process Included** remains the only action that writes optimized output files.

### Filename patterns

- Tokens: `{name}` `{prefix}` `{index}` `{folder}` `{custom}`.
- Common CLI examples:
  - `--pattern "{name}"`
  - `--pattern "{prefix}-{index}"`
  - `--pattern "{folder}-{name}"`
- FoxPix makes output names web-safe automatically and adds safe suffixes (`-2`, `-3`) when needed.
- Use **Preview** to confirm final names before writing files.

### Recommended usability workflow

1. Add source (folder or selected files).
2. Pick preset and output format.
3. Run Preview.
4. Review warnings/overrides.
5. Run Estimate Sizes (writes no files).
6. Inspect rows in Preview Studio (writes no files).
7. Process Included (writes optimized files + manifests).
8. Open output folder and review results.

### Settings clarity

- Basic settings surface preset, output format, naming pattern, and quality first.
- Advanced settings are collapsible and include alpha quality, effort, resize, metadata, and recursive controls.
- Estimate rows show clear states (not estimated, estimated, failed, larger-than-original, skipped) to improve review confidence.
- Summary supports teammate-friendly “Copy summary” output and manifest shortcuts.

### Operator shortcuts and recents

- Shortcuts: `Ctrl+O` choose folder, `Ctrl+Shift+O` choose files, `Ctrl+P` preview, `Ctrl+E` estimate, `Ctrl+Enter` process included, `Esc` clears preview image.
- Recent input/output folders are saved locally for faster repeat runs (up to 8 each).
- Open/copy actions report success or readable failure in the status area.

Privacy note: everything runs locally. No cloud upload, accounts, telemetry, or remote processing.



## Team usage

1. Launch FoxPix.
2. Drop a folder or choose image files.
3. Pick a preset.
4. Preview web-safe names.
5. Process.
6. Open output folder.
7. Upload optimized assets to the web project/CDN.


## Processing one-off additions

1. Choose **Image File(s)** or drop image files into the app.
2. Pick the same output folder as your project if needed.
3. Click **Preview**.
4. Click **Process**.
5. Upload the new optimized WebP asset.


## Team handoff / release build

This section is the handoff checklist for producing a repeatable internal release candidate.

### 1) Install dependencies (lockfile expected)

```bash
npm install
```

- This should create/update `package-lock.json`.
- Commit lockfile updates for reproducible installs.

### 2) Validate code and behavior

```bash
npm run typecheck
npm run test
npm run build
npm run build:gui
```

### 3) Package desktop artifacts

```bash
npm run package:dir
# Optional on Windows-capable environment
npm run package:win
```

### 4) Artifact locations

- Renderer build: `dist-ui/`
- Electron main/preload build: `dist-electron/`
- Packaged output: `dist-release/`

### 5) Packaging/runtime expectations

- `npm run start:gui` launches built Electron main from `dist-electron/electron/main.js`.
- Production Electron loads `dist-ui/index.html` when `VITE_DEV_SERVER_URL` is not set.
- Preload resolves from `dist-electron/electron/preload.cjs`.
- `electron-builder` config targets `dist-release/`, includes required build output + runtime dependencies, and unpacks Sharp/native `@img` modules for runtime compatibility.

### 6) Teammate manual QA checklist

- [ ] Launch app.
- [ ] Choose folder.
- [ ] Choose image file(s).
- [ ] Drag folder.
- [ ] Drag multiple image files.
- [ ] Preview.
- [ ] Process.
- [ ] Verify transparent WebP stays transparent.
- [ ] Verify EXIF-rotated photo stays upright.
- [ ] Verify web-safe names.
- [ ] Verify `manifest.json` and `manifest.csv` exist.
- [ ] Open output folder.
- [ ] Restart app and confirm settings persist.

### 7) Packaging troubleshooting

- If packaging fails with `electron-builder: not found`, run `npm install` first and retry.
- If packaged processing fails, verify native Sharp modules are present under unpacked app resources.
- If antivirus blocks a portable build, run from a trusted local folder.


## Output formats

CLI supports `--format webp|avif|jpeg|png` (default: `webp`).

- WebP is the current default and recommended output format.
- AVIF is supported in CLI processing for smaller/slower output tradeoffs.
- JPEG does not support transparency; transparent files will fail with a readable error.
- PNG output is transparency-safe and lossless-oriented.

GUI format controls are planned for a later phase; current GUI default remains WebP.
