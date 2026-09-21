# Hikes deployment model

## Production

- Branch: `main`
- Public site: `https://avdeevgreyfog-cmd.github.io/raznye-ludi-site/hikes-preview/`
- GitHub Pages deploys only from `main`.
- `hikes-preview/release.json` is the production release marker.

## Development

- Branch: `develop`
- All UI, logic and content changes are prepared here first.
- Browser smoke tests run on every relevant push to `develop`.
- Do not merge unfinished work directly to `main`.

## Release flow

1. Make changes in `develop`.
2. Run/build the Hikes bundle when any source listed in `hikes-preview/build-sources.json` changes:
   `node hikes-preview/build.mjs`.
3. Verify:
   - `node hikes-preview/workspace.test.mjs`
   - `node hikes-preview/browser-smoke.mjs`
4. Open a PR from `develop` to `main`.
5. Merge only after checks pass and the release is visually accepted.
6. Bump `hikes-preview/release.json` only for the production release.
7. GitHub Pages publishes the merged `main` automatically.

## Authentication / Supabase

The browser uses the public Supabase project configured in `hikes-preview/supabase-v42.js`.

Before inviting a wider group, verify with two real accounts:
- request a magic-link sign-in;
- open the link and return to the Hikes URL;
- submit a membership request;
- approve it as organizer;
- reload in both accounts;
- verify shared data sync and permission boundaries.

The Supabase Auth URL Configuration must allow the production callback:
`https://avdeevgreyfog-cmd.github.io/raznye-ludi-site/hikes-preview/`

Do not put service-role or other privileged keys in the repository or browser bundle.
