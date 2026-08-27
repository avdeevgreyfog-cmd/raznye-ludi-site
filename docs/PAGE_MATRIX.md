# Page matrix

| URL | Title | Purpose | User intent | Primary CTA | Page type | Required sections | Visual requirements | Content status | SEO topic | Internal links | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Разные люди | Entry + recruitment | понять команду и решить, стоит ли знакомиться | познакомиться | Home | cinematic hero, identity, team life, verified events, newcomer route, gear teaser, people, recruitment CTA | hero video, real team/action scenes, strong mobile crop | ready | страйкбольная команда Москва | team/start/gear/events/application | COMPLETE |
| `/team/` | Команда | показать людей, среду и командную работу без выдуманной истории | кто эти люди и как выглядит команда в деле | новичку / application | Large hub | hero, identity, team in motion, field environment, team-play basics, first contact, CTA | group/action scenes, documentary crops | history facts unavailable | страйкбольная команда | start/gear/application | COMPLETE |
| `/start/` | Новичку | снять неопределённость до первого контакта | как попасть и что подготовить | application | Large hub | hero, contact route, first meeting, preparation, questions, avoid-before-buying, CTA | action/editorial scene | official event-specific requirements unavailable | как попасть в страйкбольную команду | gear/events/application | COMPLETE |
| `/gear/` | Снаряжение | объяснить комплект как связанную систему | что нужно новичку и как не купить лишнее | application | Large hub | hero, interactive breakdown, observed kit patterns, mobility/compatibility, buying order, pre-event check, CTA | full fighter sequence + real equipment scene | official requirements unavailable | снаряжение для страйкбола | start/application | COMPLETE |
| `/events/` | Мероприятия | дать понятный поток подтверждённых событий | когда и на какой формат можно приехать | application / VK | Large hub | hero, upcoming/archive state, type filters, event stream, event formats, announcement anatomy, pre-trip check, newcomer transition, CTA | game/team scenes | no verified current event dates | страйкбольные тренировки и игры | start/application | COMPLETE |
| `/start/application.html` | Познакомиться | conversion | подготовить первое обращение | VK | Utility | context, short form, prepared message, success state, next-step links | restrained editorial hero | manual VK delivery by design | заявка в страйкбольную команду | start/gear | COMPLETE |
| legacy team pages | — | preserve old links | — | `/team/` | Redirect | — | — | merged | — | team | MERGE |
| legacy start pages | — | preserve old links | — | `/start/` | Redirect | — | — | merged | — | start | MERGE |
| legacy gear pages | — | preserve old links | — | `/gear/` | Redirect | — | — | merged | — | gear | MERGE |
| legacy event pages | — | preserve old links | — | `/events/` | Redirect | — | — | merged | — | events | MERGE |
| `/journal/*` | — | old prototype without verified publications | — | home | Redirect | — | — | real publications absent | — | home | REMOVE |
| `/knowledge/*` | — | old prototype without verified knowledge articles | — | start | Redirect | — | — | substantive verified articles absent | — | start | REMOVE |

## CONTENT_REQUIRED

These items are intentionally not invented and do not block the public shell from working:

1. Реальная история команды: даты, ключевые этапы, подтверждённые события и архивные фотографии.
2. Имена/позывные и роли участников — только если состав должен быть публичным.
3. Официальные требования команды к форме, защите, приводу, связи и допускам.
4. Подтверждённые upcoming/archive events for `data/events.js`.
5. Backend endpoint only if the owner later wants automatic form delivery instead of the current explicit VK handoff.
