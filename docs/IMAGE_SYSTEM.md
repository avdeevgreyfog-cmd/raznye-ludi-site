# Image system

## Statuses
- `ORIGINAL` — исходная фотография/эмблема команды.
- `GENERATED_REPLACEABLE` — сгенерированный production visual, который можно заменить без layout changes.
- `BACKGROUND` — art-directed image with focal point and safe text area.
- `DECORATIVE` — не несёт контента, alt="".
- `CONTENT_REQUIRED` — нужен реальный материал владельца.

## Current semantic map
- `assets/final_hero.mp4` — HOME_HERO / BACKGROUND.
- `assets/scene_01.webp` — TEAM_PRIMARY / BACKGROUND+CONTENT.
- `scene_02/03/04/06/08/09` — activity/team editorial visuals.
- `assets/gear/loadout-01..07.webp` — GEAR_SEQUENCE / CONTENT.
- `assets/final_logo.png` — current site emblem asset.

## Original emblem rule
Оригинальную эмблему нельзя перерисовывать. Если в будущем она меняется в репозитории, заменяется asset целиком. Генератор не должен «рисовать похожую» эмблему.

## Crops
Desktop, tablet and mobile crops проверяются отдельно. Background scenes должны иметь safe text side; content images — сохранять объект внутри кадра и явные dimensions.