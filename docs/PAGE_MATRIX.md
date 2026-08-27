# Page matrix

| URL | Title | Purpose | User intent | Primary CTA | Page type | Required sections | Visual | Content status | SEO topic | Internal links | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Разные люди | Entry + recruitment | понять команду | познакомиться | Home | hero, team, life, events, newcomer, gear, people, CTA | cinematic video + scenes | ready | страйкбольная команда Москва | team/start/gear/events | COMPLETE |
| `/team/` | Команда | показать характер команды | кто эти люди | новичку | Large hub | hero, identity, activity, visual DNA, principles, CTA | group/action scenes | history facts unavailable | страйкбольная команда | start/events | COMPLETE |
| `/start/` | Новичку | снять неопределённость | как попасть | application | Large hub | route, first meeting, bring, questions, CTA | action scene | ready | как попасть в страйкбольную команду | gear/application | COMPLETE |
| `/gear/` | Снаряжение | объяснить систему комплекта | что нужно новичку | application | Large hub | hero, interactive breakdown, observed patterns, buying order, CTA | full fighter sequence | official requirements unavailable | снаряжение для страйкбола | start/application | COMPLETE |
| `/events/` | Мероприятия | показать подтверждённые события | когда можно приехать | application/VK | Large hub | hero, filters, stream, event anatomy, newcomer CTA | game scenes | no verified event dates | страйкбольные тренировки и игры | start/application | COMPLETE |
| `/start/application.html` | Познакомиться | conversion | связаться | VK | Utility | context, short form, prepared message, success state | restrained | backend endpoint unavailable | заявка в страйкбольную команду | start | COMPLETE |
| legacy team pages | — | preserve old links | — | `/team/` | Redirect | — | — | merged | — | team | MERGE |
| legacy start pages | — | preserve old links | — | `/start/` | Redirect | — | — | merged | — | start | MERGE |
| legacy gear pages | — | preserve old links | — | `/gear/` | Redirect | — | — | merged | — | gear | MERGE |
| legacy event pages | — | preserve old links | — | `/events/` | Redirect | — | — | merged | — | events | MERGE |
| `/journal/*` | — | old prototype | — | home | Redirect | — | — | real publications absent | — | home | REMOVE |
| `/knowledge/*` | — | old prototype | — | start | Redirect | — | — | substantive verified articles absent | — | start | REMOVE |

## CONTENT_REQUIRED
1. Реальная история команды: даты, ключевые этапы, фото-архив, подтверждённые события.
2. Имена/позывные и роли участников, если состав должен быть публичным.
3. Официальные требования команды к форме, защите, приводу, связи и допускам.
4. Подтверждённые upcoming events.
5. Реальный endpoint/канал для автоматической отправки recruitment form, если требуется именно отправка без ручного VK шага.