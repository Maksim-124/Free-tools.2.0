/**
 * tools/текстред/app.js — главный контроллер
 */
(function() {
window.TextRedApp = {
  _elements: {},
  _debounceTimer: null,
  _DEFAULT_FILENAME: 'новый_документ.txt',
  _STORAGE_KEYS: { content: 'текстред_content', filename: 'текстред_filename' },
  _MAX_SIZE_MB: 5,

  init() {
    this._cacheElements();
    this._bindEvents();
    this._restoreFromStorage();
    this._updateCharCount();
  },

  _cacheElements() {
    this._elements = {
      editor: document.getElementById('editor'),
      filenameInput: document.getElementById('filenameInput'),
      downloadBtn: document.getElementById('downloadBtn'),
      copyBtn: document.getElementById('copyBtn'),
      resetBtn: document.getElementById('resetBtn'),
      openBtn: document.getElementById('openBtn'),
      fileInput: document.getElementById('fileInput'),
      dropzone: document.getElementById('dropzone'),
      charCount: document.getElementById('charCount')
    };
  },

  _bindEvents() {
    const { editor, filenameInput, downloadBtn, copyBtn, resetBtn, openBtn, fileInput, dropzone } = this._elements;

    // Автосохранение с debounce 300ms
    const saveHandler = () => {
      this._debounce(() => {
        this._autoSave();
        this._updateCharCount();
      }, 300);
    };
    editor.addEventListener('input', saveHandler);
    filenameInput.addEventListener('input', saveHandler);

    // Кнопки
    downloadBtn.addEventListener('click', () => this._handleDownload());
    copyBtn.addEventListener('click', () => this._handleCopy());
    resetBtn.addEventListener('click', () => this._handleReset());
    openBtn.addEventListener('click', () => fileInput.click());

    // Загрузка файла через Core.IO
    Core.IO.setupDropzone(dropzone, fileInput, (file) => this._handleFileLoad(file));

    // Ограничение вставки по размеру
    editor.addEventListener('paste', (e) => this._handlePasteLimit(e));

    // Горячая клавиша Ctrl+S / Cmd+S для скачивания
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this._handleDownload();
      }
    });
  },

  _debounce(fn, delay) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(fn, delay);
  },

  _autoSave() {
    const content = TextProcessor.getContent(this._elements.editor);
    const filename = this._elements.filenameInput.value.trim() || this._DEFAULT_FILENAME;

    const quotaCheck = QuotaMonitor.checkQuota(this._STORAGE_KEYS.content, content);
    if (!quotaCheck.ok) {
      Core.UI.showToast(quotaCheck.errorMsg, 4000);
      return;
    }

    Core.Storage.set(this._STORAGE_KEYS.content, content);
    Core.Storage.set(this._STORAGE_KEYS.filename, filename);
  },

  _restoreFromStorage() {
    try {
      const savedContent = Core.Storage.get(this._STORAGE_KEYS.content, '');
      const savedFilename = Core.Storage.get(this._STORAGE_KEYS.filename, this._DEFAULT_FILENAME);

      const sizeCheck = TextProcessor.checkSizeLimit(savedContent, this._MAX_SIZE_MB);
      if (!sizeCheck.ok) {
        Core.UI.showToast('Сохранённый текст превышает лимит 5 МБ. Данные не загружены.', 5000);
        Core.Storage.remove(this._STORAGE_KEYS.content);
        Core.Storage.remove(this._STORAGE_KEYS.filename);
        return;
      }

      TextProcessor.setContent(this._elements.editor, savedContent);
      this._elements.filenameInput.value = savedFilename;
      this._updateCharCount();
    } catch (e) {
      console.warn('Ошибка восстановления из Storage', e);
      Core.UI.showToast('Не удалось восстановить автосохранённые данные', 3000);
    }
  },

  _handleFileLoad(file) {
    const validation = Core.IO.validateFile(file, this._MAX_SIZE_MB, ['text/plain']);
    if (!validation.ok) {
      Core.UI.showToast(validation.error, 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const sizeCheck = TextProcessor.checkSizeLimit(content, this._MAX_SIZE_MB);
      if (!sizeCheck.ok) {
        Core.UI.showToast(sizeCheck.error, 5000);
        return;
      }

      TextProcessor.setContent(this._elements.editor, content);
      this._elements.filenameInput.value = file.name;
      this._autoSave();
      this._updateCharCount();
      Core.UI.showToast('Файл загружен: ' + file.name, 2000);
    };
    reader.onerror = () => {
      Core.UI.showToast('Ошибка чтения файла', 3000);
    };
    reader.readAsText(file, 'utf-8');
  },

  _handleDownload() {
    const rawFilename = this._elements.filenameInput.value.trim() || this._DEFAULT_FILENAME;
    const content = TextProcessor.getContent(this._elements.editor);

    if (!content) {
      Core.UI.showToast('Нечего скачивать — редактор пуст', 2500);
      return;
    }

    const validation = Validators.validateFilename(rawFilename);
    if (!validation.ok) {
      Core.UI.showToast(validation.error, 4000);
      return;
    }

    const sizeCheck = TextProcessor.checkSizeLimit(content, this._MAX_SIZE_MB);
    if (!sizeCheck.ok) {
      Core.UI.showToast(sizeCheck.error, 5000);
      return;
    }

    const blob = TextProcessor.createBlob(content, 'text/plain;charset=utf-8');
    if (!blob || blob.size === 0) {
      Core.UI.showToast('Ошибка: пустой файл', 3000);
      return;
    }

    console.log('📥 Download:', { filename: validation.sanitized, size: blob.size });

    // Надёжное скачивание с фолбэками для Firefox/iframe
    const filename = validation.sanitized;
    const url = URL.createObjectURL(blob);
    
    // Попытка 1: стандартный a.download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    try {
      a.click();
      // Фолбэк: если click() не сработал (Firefox в iframe), пробуем открыть в новом окне
      setTimeout(() => {
        if (document.body.contains(a)) {
          console.log('⚠️ a.click() не сработал, пробуем фолбэк...');
          // Попытка 2: открытие blob в новом окне/вкладке
          const win = window.open(url, '_blank');
          if (win) {
            // Если окно открылось — даём команду на сохранение (пользователь нажмёт Ctrl+S)
            win.onload = () => {
              win.document.title = filename;
              Core.UI.showToast('Файл открыт в новой вкладке. Нажмите Ctrl+S для сохранения.', 5000);
            };
          } else {
            // Попытка 3: прямая навигация (менее предпочтительно, но работает)
            window.location.href = url;
          }
        }
        // Очистка в любом случае
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(url);
        }, 1000);
      }, 200);
      
      Core.UI.showToast('Скачан: ' + filename, 2000);
    } catch (e) {
      console.error('❌ Ошибка скачивания:', e);
      Core.UI.showToast('Ошибка скачивания. Попробуйте скопировать текст.', 4000);
      // Фолбэк: копируем в буфер
      navigator.clipboard?.writeText(content).then(() => {
        Core.UI.showToast('Текст скопирован в буфер вместо скачивания', 3000);
      });
    }
  },

  _handleCopy() {
    const content = TextProcessor.getContent(this._elements.editor);
    if (!content.trim()) {
      Core.UI.showToast('Нечего копировать', 2000);
      return;
    }
    Core.IO.copyToClipboard(content).then(result => {
      Core.UI.showToast(result.ok ? 'Текст скопирован в буфер' : 'Ошибка копирования', 2500);
    });
  },

  _handleReset() {
    if (!TextProcessor.getContent(this._elements.editor).trim() && 
        this._elements.filenameInput.value === this._DEFAULT_FILENAME) {
      Core.UI.showToast('Уже пусто', 1500);
      return;
    }
    
    if (confirm('Очистить редактор и удалить автосохранение?')) {
      TextProcessor.setContent(this._elements.editor, '');
      this._elements.filenameInput.value = this._DEFAULT_FILENAME;
      Core.Storage.remove(this._STORAGE_KEYS.content);
      Core.Storage.remove(this._STORAGE_KEYS.filename);
      this._updateCharCount();
      Core.UI.showToast('Очищено', 2000);
    }
  },

  _handlePasteLimit(e) {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const current = TextProcessor.getContent(this._elements.editor);
    const newSize = TextProcessor.getSizeInBytes(current + pasted);
    const maxSize = this._MAX_SIZE_MB * 1024 * 1024;
    
    if (newSize > maxSize) {
      e.preventDefault();
      Core.UI.showToast(`Превышен лимит ${this._MAX_SIZE_MB} МБ`, 4000);
    }
  },

  _updateCharCount() {
    const content = TextProcessor.getContent(this._elements.editor);
    const bytes = TextProcessor.getSizeInBytes(content);
    const mb = (bytes / 1024 / 1024).toFixed(2);
    this._elements.charCount.textContent = `${mb} МБ`;
    
    const percent = (bytes / (this._MAX_SIZE_MB * 1024 * 1024)) * 100;
    if (percent > 90) {
      this._elements.charCount.style.color = 'var(--danger)';
    } else if (percent > 75) {
      this._elements.charCount.style.color = 'var(--warning)';
    } else {
      this._elements.charCount.style.color = 'var(--text-secondary)';
    }
  }
};
})();