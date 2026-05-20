ТекстРед — простой текстовый редактор
Лёгкий клиентский редактор для работы с .txt файлами. Всё работает в браузере, без сервера и отправки данных.
🚀 Возможности

    ✍️ Редактирование текста моноширинным шрифтом
    💾 Автосохранение в localStorage (текст + имя файла)
    ⬇️ Скачивание файла с валидацией имени
    📋 Кнопка «Копировать» для быстрого копирования в буфер
    📂 Открытие файлов: кнопка «Открыть» или перетаскивание в область редактора
    🔄 Кнопка «Сбросить» для очистки
    📱 Адаптивный интерфейс (мобильные + десктоп)
    🌓 Светлая/тёмная тема через Core.Theme
    🔒 Работа офлайн, 0 внешних запросов
    ⚠️ Лимит текста 5 МБ с защитой от переполнения
    ⌨️ Горячая клавиша Ctrl+S / Cmd+S для скачивания

📁 Структура модулей
tools/текстред/
├── index.html          # Точка входа: разметка + стили
├── app.js              # Контроллер: события, автосохранение, экспорт
├── textProcessor.js    # Логика: контент, размер, лимиты (window.TextProcessor)
├── formatManager.js    # Система экспорта: register/export (window.FormatManager)
├── validators.js       # Валидация имён файлов (window.Validators)
├── quotaMonitor.js     # Проверка квоты localStorage (window.QuotaMonitor)
├── uiManager.js        # Адаптив, тема, фокус (window.UIManager)
└── README.md           # Этот файл

🔗 Контракт модулей

window.TextProcessor
// Получить/установить контент
TextProcessor.getContent(textareaEl) // → string
TextProcessor.setContent(textareaEl, content) // void

// Размер и лимиты
TextProcessor.getSizeInBytes(text) // → number
TextProcessor.checkSizeLimit(content, maxMB=5) // → { ok: boolean, error?: string }

// Экспорт (используется напрямую для .txt)
TextProcessor.createBlob(content, mimeType) // → Blob

window.FormatManager

    ⚠️ Для формата .txt в app.js используется прямой вызов TextProcessor.createBlob. FormatManager предназначен для регистрации дополнительных форматов в будущем.

// Регистрация нового формата
FormatManager.register('md', {
    export: (content, baseFilename) => new Blob([content], { type: 'text/markdown' })
});

// Экспорт через менеджер
const blob = FormatManager.exportTo('txt', content, 'file.txt');

window.Validators
const result = Validators.validateFilename('мой файл!.txt');
// → { ok: true, sanitized: 'мой_файл_.txt' }
// → { ok: false, error: '...' }

window.QuotaMonitor
const check = QuotaMonitor.checkQuota('key', 'value');
// → { ok: true } | { ok: false, errorMsg: '...' }

window.UIManager
UIManager.init(); // Тема + адаптив
UIManager.showToast('Сообщение', 3000); // Прокси к Core.UI

⚙️ Интеграция в панель управления
1. Добавить карточку в каталог (корневой index.html)
<a href="tools/текстред/index.html" class="tool-card" data-tool="текстред">
  <div class="tool-icon">📝</div>
  <h3>ТекстРед</h3>
  <p>Редактор .txt файлов</p>
</a>

2. Добавить пункт в сайдбар
<li><a href="#" data-tool="текстред">ТекстРед</a></li>

3. Обновить атрибут sandbox у iframe

    ⚠️ Важно для Firefox 113+: добавьте allow-downloads в атрибут sandbox, иначе скачивание будет блокироваться браузером.
<iframe 
  id="toolFrame" 
  class="tool-frame" 
  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
  title="Инструмент"
></iframe>

🧪 Чек-лист тестирования

Функционал

    Автосохранение работает при вводе (debounce 300 мс)
    При перезагрузке страницы текст и имя файла восстанавливаются
    Кнопка «Скачать» валидирует имя и запускает загрузку
    Кнопка «Копировать» копирует текст в буфер обмена
    Кнопка «Сбросить» очищает всё и удаляет из Storage
    Кнопка «Открыть» и drag&drop загружают .txt файлы
    Вставка текста >5 МБ блокируется с тостом
    При переполнении localStorage — тост с советом скачать файл
    Горячая клавиша Ctrl+S / Cmd+S запускает скачивание

Валидация имён

    CON.txt → ошибка (зарезервировано)
    file<name>.txt → file_name_.txt (санитизация)
    Имя >100 символов → ошибка
    Пустое имя → авто-подстановка новый_документ.txt

Адаптив и тема

    На мобильных: textarea на всю ширину, кнопки ≥44px
    Переключение темы синхронизируется с панелью
    Фокус на textarea не ломает вёрстку на мобильных

Безопасность и приватность

    0 внешних запросов в Network tab
    Работа в приватном режиме без ошибок
    При отключённом интернете функционал не ломается

Интеграция

    Инструмент открывается в iframe панели управления
    Прямая ссылка на tools/текстред/index.html работает автономно
    0 ошибок в консоли браузера

🔧 Расширение форматов
Для добавления нового формата (например, .md):
    В formatManager.js зарегистрировать обработчик:
    
    FormatManager.register('md', {
    export: (content, baseFilename) => {
        return new Blob([content], { type: 'text/markdown;charset=utf-8' });
    }
});

В app.js в _handleDownload() добавить выбор формата (опционально):
// Пример: если нужен выбор формата
const format = 'md'; // или получить из UI
const blob = FormatManager.exportTo(format, content, validation.sanitized);

    📝 Текущая реализация для .txt использует TextProcessor.createBlob напрямую для максимальной надёжности в iframe.

📜 Лицензия
MIT. Инструмент предоставляется «как есть», без гарантий.