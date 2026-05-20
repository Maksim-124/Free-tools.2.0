/**
 * tools/текстред/textProcessor.js — обработка текста
 */
(function() {
window.TextProcessor = {
    /**
     * Максимальный размер текста в МБ
     */
    MAX_SIZE_MB: 5,

    /**
     * Получить содержимое из textarea
     * @param {HTMLTextAreaElement} el
     * @returns {string}
     */
    getContent(el) {
        return el?.value || '';
    },

    /**
     * Установить содержимое в textarea
     * @param {HTMLTextAreaElement} el
     * @param {string} content
     */
    setContent(el, content) {
        if (el) {
            el.value = content;
        }
    },

    /**
     * Подсчитать размер строки в байтах (UTF-8)
     * @param {string} text
     * @returns {number}
     */
    getSizeInBytes(text) {
        // Blob использует UTF-8, что даёт точную оценку
        return new Blob([text]).size;
    },

    /**
     * Проверить лимит размера
     * @param {string} content
     * @param {number} maxMB
     * @returns {{ ok: boolean, error?: string, sizeMB?: number }}
     */
    checkSizeLimit(content, maxMB = this.MAX_SIZE_MB) {
        const bytes = this.getSizeInBytes(content);
        const maxBytes = maxMB * 1024 * 1024;
        
        if (bytes > maxBytes) {
            const sizeMB = (bytes / 1024 / 1024).toFixed(2);
            return { 
                ok: false, 
                error: `Текст превышает лимит ${maxMB} МБ (текущий: ${sizeMB} МБ)`,
                sizeMB: parseFloat(sizeMB)
            };
        }
        return { ok: true };
    },

    /**
     * Создать Blob для скачивания
     * @param {string} content
     * @param {string} mimeType
     * @returns {Blob}
     */
    createBlob(content, mimeType = 'text/plain;charset=utf-8') {
        return new Blob([content], { type: mimeType });
    }
};
})();