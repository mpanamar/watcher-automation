# Watcher: план превращения мока в приложение и покрытие тестами

Проект-портфолио Test Automation Engineer (JS). Продукт маленький, зато на нём можно честно показать пирамиду тестов, а не только E2E по статическому HTML.

Мок (`mock-swiss/`) не переписывать. Это визуальный референс. В продукт переносится логика и этот визуал.

---

## Зачем этот продукт

**Watcher** - квиз: кадр запястья из фильма, угадать модель часов, после верного ответа открыть досье и ссылки на каталог / Chrono24.

Без домена, API и UI на компонентах «все виды тестирования» будут искусственными. Сначала границы приложения, потом тесты на этих границах.

---

## Где мы сейчас

Есть:

- визуальный мок квиза (`mock-swiss/`)
- логика угадывания внутри `app.js`: `normalize`, `isMatch`, очередь кейсов, lock/score
- зависимости под стек: Preact, Express, Zod, Playwright, Vite, `tsx`, `concurrently`, `wait-on`

Нет:

- `src/` приложения
- unit / API / component / E2E тестов
- `playwright.config.ts`
- сервера
- CI

`isMatch` - функция, которая решает, угадал ли человек часы. Сравнивает ввод с `answer` и `aliases` после нормализации (регистр, пунктуация). Сейчас она сидит в DOM-файле, поэтому unit-тесты к ней не подключить.

Vitest-набор - файл unit-тестов на эту функцию: таблица «ввод -> true/false», без браузера.

---

## Целевой каркас

```
src/
  domain/          # isMatch, схемы кейсов
  server/          # Express API
  web/             # Preact UI
tests/
  unit/
  component/
  api/
  e2e/
  a11y/
```

Стек держать узким: **Vitest + Playwright + Zod**. Не смешивать Jest, Mocha и Cypress в одном репозитории.

Один визуальный язык в приложении (swiss или industrial), не оба сразу.

---

## Пирамида тестов на этом продукте

| Слой | Что проверяет | Инструмент | Когда появляется |
|---|---|---|---|
| Unit | `normalize`, `isMatch`, очередь, lock | Vitest | Спринт 1 |
| Contract / API | статус, форма JSON, нет spoiler в GET | Vitest + HTTP к Express | Спринт 2 |
| Component | пустой Confirm, hint, dossier, prev/next | Vitest + Preact Testing Library | Спринт 3 |
| E2E | 2-3 пользовательских сценария | Playwright | Спринт 4 |
| Visual | кадр, dossier, light/dark | Playwright screenshots | После стабильного UI |
| A11y | имя поля, live region, disabled Confirm | axe-core в Playwright | После UI |
| Performance smoke | LCP кадра, INP Confirm | Playwright / Lighthouse CI | Позже |
| Security smoke | нет XSS в hint, нет `answer` в GET | API + Playwright asserts | Вместе с API |
| Mutation | unit на `isMatch` реально ловит баги | StrykerJS | Когда unit стабилен |

Не делать все слои в одном PR. Для портфолио важнее пайплайн и пирамида, чем 40 спеков одного типа.

---

## Спринт 1. Домен и unit-тесты

Цель: вынуть мозг квиза из `app.js` и покрыть его без UI.

1. Создать `src/domain/ident.ts` с `normalize` и `isMatch`.
2. Создать `src/domain/cases.ts` и Zod-схему кейса (`id`, `still`, `answer`, `aliases`, `hint`, ссылки).
3. Поставить Vitest. Скрипт `"test:unit": "vitest run"`.
4. Набор `tests/unit/ident.test.ts`:
   - точное имя модели
   - алиас без учёта регистра (`SEAMASTER`)
   - алиас с лишней пунктуацией
   - пустая строка / пробелы -> `false`
   - чужая модель (Submariner vs Seamaster) -> `false`
   - те же кейсы для Monaco и Speedmaster
5. Не трогать Playwright, пока нет Preact-UI.

Критерий готовности: `npm run test:unit` зелёный на домене, мок по-прежнему открывается отдельно.

---

## Спринт 2. Express API и контрактные тесты

Цель: ident становится HTTP-операцией, секрет ответа не утекает в клиент.

Черновик эндпоинтов:

- `GET /api/cases` - публичный список **без** поля `answer`
- `GET /api/cases/:id` - один кейс без spoiler
- `POST /api/cases/:id/ident` - тело `{ guess }`
- `GET /api/session` - score, locked ids

Zod валидирует вход и выход.

API-тесты (`tests/api/`):

- 200 и форма ответа
- `answer` нет в GET
- 400 на пустой / мусорный `guess`
- 404 на неизвестный id
- верный guess -> identified, неверный -> hint без раскрытия полного спойлера, если так решим в контракте

Это **API / contract testing**, не E2E.

Критерий готовности: сервер поднимается через `tsx`, контрактные тесты бьют в него без браузера.

---

## Спринт 3. Preact UI поверх API

Цель: настоящее приложение вместо статического мока.

1. `src/web/` на Preact + Vite. Роуты: `/`, `/case/:id` (`preact-router` уже в зависимостях).
2. Перенести визуал из `mock-swiss` как CSS/разметку компонентов.
3. Данные только с API, не из захардкоженного массива в клиенте.
4. MSW опционально: UI-тесты не требуют живого Express.

Компонентные тесты:

- пустой Confirm показывает ошибку
- неверный выбор показывает hint
- верный открывает dossier и блокирует Confirm
- Previous / Next не сбрасывает identified

Критерий готовности: `npm run mock` больше не обязателен для демо продукта; `npm run dev` поднимает web + api (`concurrently` + `wait-on` уже есть).

---

## Спринт 4. Playwright E2E

Цель: мало сценариев, которые отражают реальную ценность продукта.

Не кликать все кнопки. Три сценария:

1. Happy path: верный ident -> dossier -> ссылка на официальный каталог.
2. Sad path: неверный ident -> hint -> повторный верный ввод.
3. Очередь: next/prev и счётчик `1 / 3` (или `1 of 3`).

`playwright.config.ts`: `webServer` поднимает приложение, артефакты - HTML report и скрины.

Критерий готовности: `npx playwright test` гоняет три сценария против собранного UI, а не против папки `mock-swiss/`.

---

## Спринт 5. Остальные виды тестирования

Подключать по одному, когда предыдущий слой стабилен.

1. **Visual regression** - скрины героя с кадром, открытого dossier, light и dark.
2. **A11y** - axe-core: лейбл у поля, `aria-live` для hint/dossier, Confirm disabled после успеха.
3. **Performance smoke** - LCP кадра < разумного порога, Confirm не тормозит INP.
4. **Security smoke** - XSS в hint/history не исполняется, GET не отдаёт `answer`.
5. **Mutation testing** (Stryker) на `src/domain/ident.ts` - проверка, что unit-набор ловит сломанный матчер.
6. **Consumer contract / MSW** - UI не падает, если API убрал поле или изменил статус.

---

## Спринт 6. CI как витрина

GitHub Actions:

1. `test:unit`
2. `test:api`
3. `test:component`
4. `test:e2e` (chromium)

Артефакты: Playwright HTML report, скриншоты, coverage.

README: как гонять каждый слой и зачем продукт существует (квиз + пирамида тестов).

---

## Первый конкретный вечер (если начинать с кода)

1. `src/domain/ident.ts` + `tests/unit/ident.test.ts` из текущего `isMatch`.
2. `src/domain/cases.ts` с Zod-схемой.
3. Vitest в `package.json`.
4. Короткий абзац в README со ссылкой на этот план.

Playwright на этом шаге не подключать.

---

## Чего не делать

- Не писать E2E по HTML-моку. Он умрёт, как только появится Preact.
- Не тащить Cypress + Jest + Mocha + Playwright сразу.
- Не обещать «все виды тестирования» до появления API. Без сервера нет contract, session и negative API.
- Не смешивать два визуала в одном приложении.
- Не раздувать E2E до покрытия алиасов. Алиасы живут в unit.

---

## Как читать прогресс

Готово, если можно показать рекрутеру:

1. Зелёную пирамиду в CI.
2. Короткий демо-сценарий квиза.
3. Объяснение, **какой слой за что отвечает** и почему `isMatch` не тестируется в Playwright.
