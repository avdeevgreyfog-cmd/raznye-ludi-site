# Hikes workspace release 61

- Preserve the existing sidebar, Overview, Participants, event IDs, and state structures.
- Load app.bundle.css and app.bundle.js directly; remove late CSS and chained workspace script insertion.
- Roles: leader, navigator, quartermaster; applications and organizer assignments; scoped medic and optional food delegation.
- Shared equipment: self-service quantity commitments; editable medical kit; demand edits preserve commitments.
- Transport: inherit the return journey, preserve separately configured rides, prevent invalid coordinates and duplicate driver/passenger intent.
- Plan: derive checkpoint rows from route timing. Food: bind a meal to a timeline event and include household water.
- Cloud: include the actual app storage key in autosave; use revision checks and server-side permissions. Show save errors instead of silently swallowing them.

## Build

Run `node hikes-preview/build.mjs` after changing a source in build-sources.json. The legacy source modules remain build inputs, not separate browser downloads. This consolidation preserves CSS cascade semantics; it is not a complete removal of every obsolete CSS declaration.

## Validation

The combined JavaScript and edited source files passed syntax checks. Workspace interactions were exercised in a stub DOM runtime (return inheritance/cancellation, self travel, permissions, preview, role output). Reproduce with `node hikes-preview/workspace.test.mjs`.

Both database migrations were applied. Authenticated multi-user writes and visual browser rendering were not verified in this session: the SQL connection rejected transactional fixture writes and access to the private helper, and no browser execution tool was available. Before treating multi-user coordination as production-verified, test two actual authenticated accounts: request/approve/cancel a seat, simultaneous changes, candidate submission, equipment quantity, scoped menu and route edits, reload and downloads.
