# Backend

API доски задач на NestJS. База — PostgreSQL 16 в Docker.

Команды ниже выполняются из каталога `backend`.

## Запуск

Скопировать окружение:

```bash
cp .env.example .env
```

Поднять Postgres из корня репозитория (`docker-compose.yml` лежит там):

```bash
docker compose -f ../docker-compose.yml up -d postgres
```

Собрать и запустить весь проект (Postgres, API и фронт) из корня:

```bash
docker compose up --build
```

API будет на `http://localhost:3000`, доска — на `http://localhost:5173`. Для `npm run start:dev` на хосте достаточно сервиса `postgres`: контейнер API занимает тот же порт `3000`.

Установить зависимости, применить миграции и запустить API:

```bash
npm install
npm run migration:run
npm run start:dev
```

Сервер слушает порт из `PORT` (в `.env.example` это `3000`), префикс маршрутов — `api`. `GET /api` отвечает `{ "status": "ok" }`.

## Тесты

```bash
npm test
```
