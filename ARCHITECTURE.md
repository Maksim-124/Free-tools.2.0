# ARCHITECTURE.md — free-Tools

> 📌 Этот файл — источник истины. Любое изменение API ядра должно отражаться здесь.

## 🧭 Философия
- **Всё в браузере**: данные не покидают устройство, 0 внешних запросов в production
- **Модульность**: `core/` (ядро) + `tools/` (автономные инструменты)
- **Нулевые зависимости в runtime**: всё либо инлайн, либо в `assets/`
- **Приватность по умолчанию**: нет трекеров, аналитики, авторизации

---

## 🗂️ Структура репозитория

/
├── core/ # Ядро: общие модули (подключаются первыми)
│ ├── io.js # Ввод/вывод: файлы, clipboard, drag&drop
│ ├── ui.js # Интерфейс: тосты, анимации, вкладки
│ ├── storage.js # Хранение: обёртка над localStorage
│ └── theme.js # Темы: светлая/тёмная, системные предпочтения
├── tools/ # Инструменты (каждый — автономная папка)
│ ├── колорпро/
│ │ ├── index.html # Точка входа инструмента
│ │ ├── app.js # Тонкий контроллер (события + связь с ядром)
│ │ ├── colorExtractor.js # Чистая логика (экспорт: window.ColorExtractor)
│ │ ├── uiManager.js # Управление интерфейсом (экспорт: window.UIManager)
│ │ └── README.md # Документация инструмента
│ ├── текстпро/
│ └── faviconпро/
├── assets/ # Статика: библиотеки, иконки, стили
│ ├── libs/
│ │ ├── color-thief/
│ │ │ └── color-thief.min.js
│ │ └── jszip/
│ │ └── jszip.min.js
│ └── favicon/
│ ├── favicon.ico
│ ├── apple-touch-icon.png
│ └── ...
├── scripts/ # Утилиты для разработчика (не для пользователя)
│ └── build-css.js # Однократная сборка Tailwind для production
├── index.html # Каталог-лендинг (витрина инструментов)
├── ARCHITECTURE.md # Этот файл
└── README.md # Общее описание проекта для пользователей


---

## ⚙️ API ядра (`core/`)

Все модули используют **IIFE-паттерн** и экспортируют через `window.Core.*`.

### `window.Core.IO` — ввод/вывод
```javascript
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
// Инициализация тостов
Core.UI.initToast(toastEl)

// Показать уведомление
Core.UI.showToast(msg, timeoutMs = 2500)

// Анимация появления
Core.UI.fadeUp(element)

// Переключение активной вкладки
Core.UI.setActiveTab(activeBtn, groupSelector = '.tab-btn')

// Плавный скролл к элементу
Core.UI.scrollTo(element, offset = 0)

// Показать/скрыть с анимацией
Core.UI.toggleVisibility(element, show: boolean)

window.Core.Storage — хранение
// Получить значение (с безопасным парсингом)
Core.Storage.get(key, fallback = null)

// Сохранить значение (с try/catch)
Core.Storage.set(key, value)

// Удалить значение
Core.Storage.remove(key)

// Очистить по префиксу
Core.Storage.clear(prefixFilter = '')

window.Core.Theme — темы
// Применить сохранённую/системную тему
Core.Theme.init()

// Переключить тему
const newTheme = Core.Theme.toggle() // 'light' | 'dark'

// Получить текущую тему
const current = Core.Theme.get() // 'light' | 'dark'

🔗 Контракт инструмента (tools/колорпро/)
Обязательные файлы
Файл
Роль
Экспорт
index.html
Точка входа: разметка + подключение зависимостей
—
app.js
Тонкий контроллер: события, связь UI ↔ логика
—
*.js (логика)
Чистая бизнес-логика
window.ModuleName
README.md
Документация инструмента
—

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
Работает при открытии через file://
Работает в приватном/инкогнито режиме
При отключённом интернете функционал не ломается
В консоли браузера: 0 ошибок, 0 внешних запросов (кроме вендоренных библиотек)
Все пути относительные, нет fetch(), import, CDN в production

➕ Добавление нового инструмента
Создайте папку: tools/новый-инструмент/
Скопируйте шаблон index.html из tools/колорпро/
Реализуйте логику в app.js, используя Core.* модули
Добавьте вендорные библиотеки в assets/libs/ (если нужны)
Обновите index.html каталога (добавьте карточку инструмента)
Протестируйте:

🧪 Тестирование
Чек-лист для каждого инструмента
- [ ] Открыть через file:// → все функции работают
- [ ] Приватный режим → нет ошибок, данные не сохраняются
- [ ] Отключить интернет → функционал не ломается
- [ ] Консоль браузера → 0 ошибок, 0 внешних запросов (кроме вендоренных)
- [ ] Мобильный браузер → адаптивность, тач-интерфейс
- [ ] Копирование/скачивание → работает с fallback'ами

Глобальные тесты
- [ ] Переключение темы → сохраняется в localStorage
- [ ] Навигация между инструментами → работает через прямые ссылки
- [ ] Поиск по каталогу (если есть) → не использует внешние библиотеки

🔄 Версионирование
Формат: MAJOR.MINOR.PATCH (SemVer)
MAJOR: изменение API ядра, ломающее обратную совместимость
MINOR: новый инструмент или функционал без ломающих изменений
PATCH: багфиксы, оптимизации, документация
При изменении core/* обновляйте этот файл и указывайте версию в заголовке:
# ARCHITECTURE.md — free-Tools 2.0 (v2.1.0)

📜 Лицензия
MIT. Все инструменты и ядро распространяются как есть, без гарантий.


