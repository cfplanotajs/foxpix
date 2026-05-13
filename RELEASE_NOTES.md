# FoxPix Internal Release Candidate Notes

## Release candidate focus
Distribution-readiness and handoff packaging only.

## Included in this RC
- Added release artifact ignore rules for `dist-release/`.
- Confirmed packaging scripts and electron-builder configuration for local RC packaging.
- Added README handoff section with reproducible validation + packaging steps.
- Added teammate manual QA checklist for folder mode, file mode, drag/drop flows, transparency, EXIF orientation, naming, manifests, and settings persistence.

## Validation status in this environment
- Typecheck, tests, core build, and GUI build pass.
- Packaging commands require `electron-builder` to be installed from npm registry in the environment.
