/**
 * ocrProcessor.js — обёртка над Tesseract.js v5 для ТекстПРО
 * Экспорт: window.OCRExtractor
 * Не зависит от DOM, работает в любом контексте
 */
console.log('🔍 [DEBUG] ocrProcessor.js ЗАГРУЖЕН');
(function() {
    'use strict';

    window.OCRExtractor = {
        _worker: null,
        _isReady: false,
        _currentLang: null,

        async init(langs = ['rus', 'eng'], onProgress = null) {
            const langKey = langs.sort().join('+');
            
            // Кэширование: если воркер уже запущен с теми же языками — не перезагружаем
            if (this._isReady && this._worker && this._currentLang === langKey) {
                return true;
            }

            // Если языки изменились — чистый перезапуск
            if (this._worker) {
                await this._worker.terminate();
                this._worker = null;
                this._isReady = false;
            }

            try {
                this._worker = await Tesseract.createWorker(langs.join('+'), 2, {
                    logger: (m) => {
                        // Отдаём UI только значимые этапы
                        if (['loading tesseract core', 'initializing api', 'recognizing text'].includes(m.status)) {
                            onProgress?.(m);
                        }
                    },
                    // Пути к локальным ассетам (относительно index.html инструмента)
                    langPath: '../../assets/libs/tesseract/lang',
                    cachePath: '../../assets/libs/tesseract',
                    cacheMethod: 'none'
                });

                this._currentLang = langKey;
                this._isReady = true;
                return true;
            } catch (e) {
                console.error('OCR Init failed:', e);
                throw new Error('Не удалось загрузить движок OCR. Проверьте файлы в assets/libs/tesseract/');
            }
        },

        async recognize(file, onProgress = null) {
            if (!this._worker || !this._isReady) {
                throw new Error('Движок OCR не инициализирован. Вызовите init() первым');
            }

            const startTime = performance.now();
            
            // Tesseract.js v5: результат в result.data
            const result = await this._worker.recognize(file);
            const { text, confidence } = result.data;

            const timeMs = Math.round(performance.now() - startTime);

            return {
                text: (text || '').trim(),
                confidence: Math.round(confidence || 0),
                timeMs
            };
        },

        async destroy() {
            if (this._worker) {
                await this._worker.terminate();
                this._worker = null;
                this._isReady = false;
                this._currentLang = null;
            }
        },

        isReady() {
            return this._isReady && !!this._worker;
        }
    };
})();