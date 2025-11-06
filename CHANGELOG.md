# Changelog
Все заметные изменения этого проекта документируются здесь.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).
Версионирование — [SemVer](https://semver.org/lang/ru/).

## [Unreleased]
### Added
- Файл docker-compose.dev.yaml
- Файл docker-compose.prod.yml
- Поддержка access и refresh токенов
- Корректная обработка ошибок через Zod
- Валидация схем через Zod
- OpenAPI генератор
- Маршруты авторизации: /api/auth/login, /api/auth/refresh, /api/auth/logout, /api/auth/me
- Swagger UI по адресу /api/docs и /api/openapi.json
- Валидация тела запроса на /auth/login (Zod)
- Обёртка asyncHandler для безопасной обработки ошибок в контроллерах
- Маршрут создания пользователя: POST /api/users (только superadmin)
- Bootstrap супер-админа через ALLOW_BOOTSTRAP и BOOTSTRAP_* env
- Интеграционные тесты: логин superadmin → create user → логин user → запрет на создание
- OpenAPI для Auth и Users с корректной security (login/refresh/logout без Bearer)

### Changed
- 

### Fixed
- 

---

## v0.1.5 - 2025-10-16
### Added
- 

### Changed
- 

### Fixed
- 
