/**
 * tools/текстред/formatManager.js — система экспорта форматов
 */
(function() {
window.FormatManager = {
    formats: {},

    /**
     * Зарегистрировать обработчик формата
     * @param {string} name — имя формата (например, 'txt')
     * @param {{ export: (content: string, baseFilename: string) => Blob }} handler
     */
    register(name, handler) {
        if (!name || !handler || typeof handler.export !== 'function') {
            console.warn('FormatManager: некорректный обработчик', name);
            return false;
        }
        this.formats[name.toLowerCase()] = handler;
        return true;
    },

    /**
     * Получить список зарегистрированных форматов
     * @returns {string[]}
     */
    getFormats() {
        return Object.keys(this.formats);
    },

    /**
     * Экспортировать контент в указанный формат
     * @param {string} name
     * @param {string} content
     * @param {string} baseFilename
     * @returns {Blob | null}
     */
    exportTo(name, content, baseFilename) {
        const handler = this.formats[name.toLowerCase()];
        if (!handler) {
            console.warn('FormatManager: формат не найден', name);
            return null;
        }
        try {
            return handler.export(content, baseFilename);
        } catch (e) {
            console.error('FormatManager: ошибка экспорта', e);
            return null;
        }
    }
};

// Регистрация базового обработчика для .txt
FormatManager.register('txt', {
    export: function(content, baseFilename) {
        return TextProcessor.createBlob(content, 'text/plain;charset=utf-8');
    }
});
})();