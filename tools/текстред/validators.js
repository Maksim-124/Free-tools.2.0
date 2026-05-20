/**
 * tools/текстред/validators.js — валидация имён файлов
 */
(function() {
window.Validators = {
    /**
     * Зарезервированные имена Windows (без учёта регистра)
     */
    _reservedNames: [
        'CON','PRN','AUX','NUL',
        'COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9',
        'LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9'
    ],

    /**
     * Валидация и санитизация имени файла
     * @param {string} raw — исходное имя
     * @returns {{ ok: boolean, sanitized?: string, error?: string }}
     */
    validateFilename(raw) {
        if (!raw || typeof raw !== 'string') {
            return { ok: false, error: 'Имя файла не может быть пустым' };
        }

        // Замена недопустимых символов на подчёркивание
        // Разрешены: буквы, цифры, пробел, точка, дефис, подчёркивание
        let sanitized = raw.replace(/[^a-zA-Z0-9\s.\-_]/g, '_');

        // Убираем лишние пробелы по краям
        sanitized = sanitized.trim();

        // Проверка длины (макс. 100 символов)
        if (sanitized.length > 100) {
            return { ok: false, error: 'Имя файла слишком длинное (макс. 100 символов)' };
        }

        // Извлекаем базовое имя без расширения для проверки зарезервированных имён
        const baseName = sanitized.replace(/\.[^.]*$/, '').toUpperCase();

        // Проверка на зарезервированные имена Windows
        if (this._reservedNames.includes(baseName)) {
            return { 
                ok: false, 
                error: `Имя "${baseName}" зарезервировано системой и не может быть использовано` 
            };
        }

        // Проверка, что имя не пустое после санитизации
        if (!sanitized) {
            return { ok: false, error: 'Имя файла не может состоять только из спецсимволов' };
        }

        // Добавляем расширение .txt если нет
        if (!/\.[^.]+$/.test(sanitized)) {
            sanitized += '.txt';
        }

        return { ok: true, sanitized };
    }
};
})();