# Smart Canvas Learn

AI-тьютор на `React + Vite + TypeScript + Supabase`, который умеет:

- объяснять темы на интерактивной доске;
- сохранять учебные материалы;
- генерировать тесты по предметам;
- проверять ответы через edge functions;
- считать прогресс по темам и предметам.

## Стек

- Frontend: `React 18`, `Vite`, `TypeScript`, `Tailwind CSS`, `shadcn/ui`
- Data/API: `Supabase`
- AI: edge functions `tutor-board`, `quiz-check`, `generate-tests`
- Tests: `Vitest`, `Testing Library`

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` с клиентскими переменными:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

3. Запустить dev-сервер:

```bash
npm run dev
```

4. Полезные команды:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

## Переменные окружения

На фронтенде используются:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Для edge functions в Supabase нужны:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_MODEL` — опционально, по умолчанию используется `gemini-2.0-flash-lite`

## Структура

```text
src/
  components/   UI и прикладные компоненты
  hooks/        бизнес-логика страниц и reusable hooks
  lib/          чистые утилиты, парсеры и агрегации данных
  pages/        route-level страницы
  services/     слой работы с Supabase и edge functions
  types/        общие типы приложения

supabase/
  functions/    edge functions для AI и проверки ответов
  migrations/   SQL-миграции
```

## Основные таблицы Supabase

- `knowledge_items` — пользовательские заметки и материалы
- `progress_records` — результаты ответов и агрегируемый прогресс
- `user_tests` — сгенерированные тесты и результаты прохождения
- `tutor_generations` — сохранённые AI-генерации для доски

## Edge Functions

### `tutor-board`

Принимает запрос ученика, историю диалога, прикреплённое изображение и знания из заметок, затем возвращает:

- заголовок урока;
- summary;
- пошаговые объяснения;
- элементы доски;
- контрольные вопросы.

### `quiz-check`

Проверяет ответ ученика, возвращает `correct/message` и адаптирует глубину объяснения по числу ошибок.

### `generate-tests`

Создаёт большой тематический тест, делит его на секции и сохраняет итог в `user_tests`.

## Архитектурные договорённости

- Работа с Supabase и edge functions идёт через `src/services/tutorData.ts`.
- Восстановление данных из `localStorage` и парсинг AI-ответов вынесены в `src/lib/`.
- Состояние тяжёлых страниц вынесено в `useSubjectWorkspace` и `useTestsPage`.
- Роуты загружаются лениво через `React.lazy`, чтобы не собирать всё приложение в один initial bundle.

## Тестовое покрытие

Сейчас покрыты быстрыми unit-тестами:

- восстановление сообщений и истории обучения;
- парсинг и нормализация тестов;
- агрегация прогресса;
- восстановление профиля из `localStorage`.

Тесты лежат рядом с логикой в `src/lib/*.test.ts`.

## Деплой

В репозитории есть [`render.yaml`](./render.yaml) для сборки статического фронтенда на Render:

- `npm ci && npm run build`
- публикация каталога `dist`

Для корректной работы production-окружения значения переменных должны быть заданы и в Render, и в Supabase.
