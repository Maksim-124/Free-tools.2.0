# КолорПро — генератор цветовой схемы (free-Tools 2.0)

## Запуск
1. Откройте `index.html` напрямую в браузере (через `file://`)
2. Или задеплойте на GitHub Pages

## Зависимости
- `../../core/*.js` — ядро free-Tools 2.0
- `../../assets/libs/color-thief/color-thief.min.js` — библиотека для извлечения палитры (скачайте вручную)

## Архитектура
- `colorExtractor.js` — чистая логика, экспорт через `window.ColorExtractor`
- `uiManager.js` — управление интерфейсом, экспорт через `window.UIManager`
- `app.js` — тонкий контроллер, использует `Core.IO`, `Core.UI`
- `index.html` — разметка + подключение зависимостей
## 🔧 Важное: структура dropzone
Для корректной работы клика по зоне загрузки:
- `<input id="fileInput">` должен находиться **внутри** `#dropzone`
- Input должен иметь стили: `position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index:10;`
- Не добавляйте `pointer-events:none` на дочерние элементы — input перекрывает их и принимает клики

## Контракт с ядром
Инструмент использует:
- `Core.IO.validateFile()`, `setupDropzone()`, `previewImage()`, `copyToClipboard()`
- `Core.UI.showToast()`, `toggleVisibility()`, `setActiveTab()`, `scrollTo()`

## Тестирование
- [ ] Открыть через `file://`
- [ ] Проверить приватный режим
- [ ] Отключить интернет → убедиться, что всё работает
- [ ] Проверить консоль: 0 внешних запросов

## Лицензия
MIT. Используйте свободно.