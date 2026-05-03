/**
 * faviconGenerator.js — чистая логика генерации фавиконов
 * Экспортирует: window.FaviconGenerator
 * Не зависит от DOM, работает в любом контексте
 */
(function() {
    'use strict';
    
    window.FaviconGenerator = {
        // Доступные размеры по умолчанию
        defaultSizes: [16, 32, 48, 64, 128, 180, 192, 512],
        
        // Описание размеров для UI
        sizeHints: {
            16: 'вкладка браузера',
            32: 'панель задач',
            48: 'стандартный',
            64: 'стандартный',
            128: 'стандартный',
            180: 'Apple Touch Icon',
            192: 'PWA / Android',
            512: 'PWA / магазин'
        },

        /**
         * Создать ImageBitmap из файла
         * @param {File} file
         * @returns {Promise<ImageBitmap>}
         */
        async loadImageBitmap(file) {
            return createImageBitmap(file);
        },

        /**
         * Сгенерировать одну иконку заданного размера
         * @param {ImageBitmap} sourceBitmap
         * @param {number} size
         * @returns {Promise<Blob>} PNG Blob
         */
        async generateIcon(sourceBitmap, size) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Прозрачный фон
            ctx.clearRect(0, 0, size, size);
            
            // Вычисляем размеры для сохранения пропорций
            const imgW = sourceBitmap.width;
            const imgH = sourceBitmap.height;
            let drawW, drawH, offsetX = 0, offsetY = 0;
            
            if (imgW > imgH) {
                drawW = size;
                drawH = (imgH / imgW) * size;
                offsetY = (size - drawH) / 2;
            } else {
                drawH = size;
                drawW = (imgW / imgH) * size;
                offsetX = (size - drawW) / 2;
            }
            
            // Рисуем с центрированием
            ctx.drawImage(sourceBitmap, 0, 0, imgW, imgH, offsetX, offsetY, drawW, drawH);
            
            // Конвертируем в PNG
            return new Promise((resolve, reject) => {
                canvas.toBlob(
                    blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
                    'image/png'
                );
            });
        },

        /**
         * Сгенерировать набор иконок
         * @param {ImageBitmap} sourceBitmap
         * @param {number[]} sizes
         * @param {(progress: number) => void} onProgress — колбэк 0-100%
         * @returns {Promise<Map<number, Blob>>} размер → Blob
         */
        async generateSet(sourceBitmap, sizes, onProgress) {
            const result = new Map();
            const sorted = [...sizes].sort((a, b) => a - b);
            
            for (let i = 0; i < sorted.length; i++) {
                const size = sorted[i];
                const blob = await this.generateIcon(sourceBitmap, size);
                result.set(size, blob);
                if (typeof onProgress === 'function') {
                    onProgress(Math.round(((i + 1) / sorted.length) * 100));
                }
            }
            return result;
        },

        /**
         * Создать ZIP-архив из набора иконок
         * @param {Map<number, Blob>} blobs
         * @returns {Promise<Blob>} ZIP Blob
         */
        async createZip(blobs) {
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library not loaded');
            }
            
            const zip = new JSZip();
            
            // Добавляем все иконки
            for (const [size, blob] of blobs.entries()) {
                zip.file(`favicon-${size}x${size}.png`, blob);
            }
            
            // Добавляем стандартные имена
            if (blobs.has(32)) zip.file('favicon-32x32.png', blobs.get(32));
            if (blobs.has(16)) zip.file('favicon-16x16.png', blobs.get(16));
            if (blobs.has(180)) zip.file('apple-touch-icon.png', blobs.get(180));
            if (blobs.has(192)) zip.file('android-chrome-192x192.png', blobs.get(192));
            if (blobs.has(512)) zip.file('android-chrome-512x512.png', blobs.get(512));
            
            return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        },

        /**
         * Получить подсказку для размера
         * @param {number} size
         * @returns {string}
         */
        getSizeHint(size) {
            return this.sizeHints[size] || 'стандартный';
        }
    };
})();