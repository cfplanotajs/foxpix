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

- `quality: 85`
- `alphaQuality: 100`
- `effort: 4`
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

