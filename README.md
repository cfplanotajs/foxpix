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

## Create sample images

```bash
npm run create-samples
```

This generates local fixtures under `sample-input/` for quick validation.

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

1. Select input folder.
2. Select output folder (or use default `<input>/optimized`).
3. Set prefix/pattern and compression settings.
4. Click **Preview (dry run)** to review planned output names.
5. Optionally drag-and-drop a folder into the drop zone to set input quickly.
6. Pick a built-in workflow preset or custom settings.
7. Click **Process** to run conversion and write manifest files (`manifest.json`, `manifest.csv`).
8. Settings are remembered between app launches.
6. Review summary and failed-file messages, then open output folder.

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
