# Site architecture

## Canonical public IA
- `/` — эмоциональная входная точка и recruitment funnel.
- `/team/` — характер команды, среда, люди и командная работа без выдуманной истории.
- `/start/` — маршрут новичка до первого выезда.
- `/gear/` — визуальный hub снаряжения и interactive breakdown.
- `/events/` — event stream; публикует только подтверждённые данные.
- `/start/application.html` — utility conversion page.
- `/404.html` — системная страница.

## Merged legacy pages
`team/about`, `team/history`, `team/people`, `team/principles`, `team/rules` → `/team/`.
`start/how-to-join`, `first-training`, `what-to-bring`, `faq` → anchors inside `/start/`.
`gear/requirements`, `uniform`, `load-bearing`, `roles`, `checklists`, old `/pages/gear.html` → `/gear/`.
`events/calendar`, `archive`, `event` → `/events/` until verified event data exists.

## Removed from primary IA
Journal and knowledge-base prototype pages are noindex redirects until real publications exist. They must not appear in primary navigation or sitemap before substantive content is available.