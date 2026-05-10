# README.md — free-tools.ru

> 📌 Этот файл — источник истины. Любое изменение API ядра должно отражаться здесь.

## 🧭 Философия
- **Всё в браузере**: данные не покидают устройство, 0 внешних запросов в production
- **Модульность**: `core/` (ядро) + `tools/` (автономные инструменты)
- **Нулевые зависимости в runtime**: всё либо инлайн, либо в локальных `assets/`
- **Приватность по умолчанию**: нет трекеров, аналитики, авторизации
- **Работа в вебе**: инструменты запускаются через веб-сервер (локальный или продакшен), не требуя `file://`

---

## 🗂️ Структура репозитория

/
├── core/                     # Ядро: общие модули (подключаются первыми)
│   ├── io.js                 # Ввод/вывод: файлы, clipboard, drag&drop
│   ├── ui.js                 # Интерфейс: тосты, анимации, вкладки
│   ├── storage.js            # Хранение: обёртка над localStorage
│   └── theme.js              # Темы: светлая/тёмная, системные предпочтения
├── tools/                    # Инструменты (каждый — автономная папка)
│   ├── колорпро/
│   │   ├── index.html        # Точка входа инструмента
│   │   ├── app.js            # Тонкий контроллер (события + связь с ядром)
│   │   ├── colorExtractor.js # Чистая логика (экспорт: window.ColorExtractor)
│   │   ├── uiManager.js      # Управление интерфейсом (экспорт: window.UIManager)
│   │   └── README.md
│   ├── текстпро/
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── textProcessor.js
│   │   ├── ocrProcessor.js
│   │   └── README.md
│   └── faviconпро/
│       ├── index.html
│       ├── app.js
│       ├── faviconGenerator.js
│       └── README.md
├── assets/                   # Статика: библиотеки, иконки, стили
│   ├── mascot.webp           # Логотип панели управления
│   ├── favicon/
│   │   ├── favicon.ico
│   │   ├── favicon16x16.png … favicon64x64.png
│   │   └── apple-touch-icon.png
│   └── libs/
│       ├── color-thief/      # color-thief.min.js
│       ├── jszip/            # jszip.min.js
│       └── tesseract/        # tesseract.min.js, worker.min.js, lang/*.traineddata
├── site.webmanifest
├── index.html                # Панель управления (каталог + встроенные инструменты)
└── README.md                 # Этот файл


🖥️ Панель управления (index.html)

Главная точка входа для пользователя.
В левой части — сайдбар с логотипом (кликабельный, возвращает на главную) и раскрывающимся меню «Инструменты».
При клике по карточке или пункту меню инструмент загружается в <iframe> внутри основной области, не покидая панели.
Также есть кнопка «Открыть в новой вкладке» для каждого инструмента.

Сам index.html полностью самодостаточен, использует только локальные скрипты ядра и стили.
Никаких внешних CDN.


⚙️ API ядра (core/)

Все модули используют IIFE-паттерн и экспортируют через window.Core.*.

window.Core.IO — ввод/вывод

// Валидация файла
Core.IO.validateFile(file, maxSizeMB = 10, allowedTypes = ['image/png', 'image/jpeg', 'image/webp'])
// → { ok: true } | { ok: false, error: '...' }

// Настройка drag&drop
Core.IO.setupDropzone(dropzoneEl, fileInputEl, onFileSelected: (file) => void)

// Показ превью изображения
Core.IO.previewImage(file, imgEl, onLoaded: (w, h) => void)

// Копирование в буфер (с fallback)
await Core.IO.copyToClipboard(text)
// → { ok: true } | { ok: false, error: '...' }

// Скачивание файла
Core.IO.downloadBlob(blob, filename)

window.Core.UI — интерфейс

Core.UI.initToast(toastEl)
Core.UI.showToast(msg, timeoutMs = 2500)
Core.UI.fadeUp(element)
Core.UI.setActiveTab(activeBtn, groupSelector = '.tab-btn')
Core.UI.scrollTo(element, offset = 0)
Core.UI.toggleVisibility(element, show: boolean)

window.Core.Storage — хранение

Core.Storage.get(key, fallback = null)
Core.Storage.set(key, value)
Core.Storage.remove(key)
Core.Storage.clear(prefixFilter = '')

window.Core.Theme — темы

Core.Theme.init()          // применить сохранённую/системную тему
const newTheme = Core.Theme.toggle() // 'light' | 'dark'
const current = Core.Theme.get()     // 'light' | 'dark'

🔗 Контракт инструмента (tools/название/)
Обязательные файлы
Файл	Роль	Экспорт
index.html	Точка входа: разметка + подключение зависимостей	—
app.js	Тонкий контроллер: события, связь UI ↔ логика	—
*.js (логика)	Чистая бизнес-логика	window.ModuleName
README.md	Документация инструмента	—

Правила подключения скриптов
<!-- 1. Ядро (относительные пути от tools/инструмент/) -->
<script src="../../core/io.js"></script>
<script src="../../core/ui.js"></script>
<script src="../../core/storage.js"></script>
<script src="../../core/theme.js"></script>

<!-- 2. Вендорные библиотеки (если нужны) -->
<script src="../../assets/libs/color-thief/color-thief.min.js"></script>

<!-- 3. Логика инструмента -->
<script src="colorExtractor.js"></script>
<script src="uiManager.js"></script>
<script src="app.js"></script>

Обязательные проверки перед релизом инструмента

    Работает в браузере через HTTP (локальный сервер или после деплоя)

    Работает в приватном/инкогнито режиме

    При отключённом интернете функционал не ломается (после загрузки всех ресурсов)

    0 ошибок в консоли, 0 внешних сетевых запросов (кроме загрузки вендорных библиотек)

    Все пути относительные, нет fetch, import, CDN в production

    Инструмент корректно открывается внутри панели управления (iframe)

    ➕ Добавление нового инструмента

    Создайте папку: tools/новый-инструмент/

    Скопируйте шаблон index.html из tools/колорпро/

    Реализуйте логику в app.js, используя Core.* модули

    Добавьте вендорные библиотеки в assets/libs/ (если нужны)

    Обновите index.html в корне: добавьте карточку инструмента и пункт в подменю с атрибутом data-tool

    Проверьте чек-лист ниже

    🧪 Тестирование
Чек-лист для каждого инструмента

    Открыть через HTTP-сервер (например, python -m http.server или живой домен)

    Приватный режим браузера → нет ошибок, данные не сохраняются

    Отключить интернет после загрузки → функционал не ломается

    Консоль браузера → 0 ошибок, 0 внешних запросов (кроме вендоренных)

    Мобильный браузер → адаптивность, тач-интерфейс

    Копирование/скачивание → работает с fallback'ами

Глобальные тесты

    Переключение темы в панели управления → сохраняется в localStorage

    Переход между инструментами через сайдбар → инструменты загружаются в iframe без перезагрузки панели

    Прямая ссылка на инструмент (например, tools/текстпро/index.html) → страница работает автономно

    Возврат на главную кликом по логотипу → панель с карточками отображается

🔄 Версионирование

Формат: MAJOR.MINOR.PATCH (SemVer)
MAJOR: изменение API ядра, ломающее обратную совместимость
MINOR: новый инструмент или функционал без ломающих изменений
PATCH: багфиксы, оптимизации, документация

При изменении core/* обновляйте этот файл и указывайте версию в заголовке:
# README.md — free-tools.ru (v2.2.0)

📜 Лицензия

MIT. Все инструменты и ядро распространяются как есть, без гарантий.