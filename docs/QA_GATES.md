# QA gates

Release is blocked when any of the following is above zero: critical issues, major issues, broken internal links, page errors, console errors, JS exceptions, horizontal overflow, public prototype phrases.

Automated browser checks live in `tests/site.spec.js` and cover core pages at desktop and mobile sizes, menu behavior, horizontal overflow, application flow and local internal links.

Visual review remains manual/critic-based: hierarchy, crop, rhythm, negative space, typography, narrative flow and template feeling.

Severity: CRITICAL blocks use or correctness; MAJOR materially breaks route/visual hierarchy/accessibility; MINOR polish issue without route breakage.