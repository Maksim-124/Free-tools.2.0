/**
 * core/storage.js — безопасная обёртка над localStorage
 */
(function() {
    window.Core = window.Core || {};

    window.Core.Storage = {
        _prefix: 'freeTools_',

        /**
         * Получить значение из localStorage
         * @param {string} key
         * @param {*} fallback
         * @returns {*}
         */
        get(key, fallback = null) {
            try {
                const raw = localStorage.getItem(this._prefix + key);
                if (raw === null) return fallback;
                return JSON.parse(raw);
            } catch {
                return fallback;
            }
        },

        /**
         * Сохранить значение в localStorage
         * @param {string} key
         * @param {*} value
         * @returns {boolean}
         */
        set(key, value) {
            try {
                localStorage.setItem(this._prefix + key, JSON.stringify(value));
                return true;
            } catch {
                console.warn('localStorage недоступен');
                return false;
            }
        },

        /**
         * Удалить значение
         * @param {string} key
         */
        remove(key) {
            try {
                localStorage.removeItem(this._prefix + key);
            } catch {}
        },

        /**
         * Очистить все ключи с префиксом
         * @param {string} prefixFilter — опционально, уточняющий префикс
         */
        clear(prefixFilter = '') {
            try {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith(this._prefix + prefixFilter)) {
                        localStorage.removeItem(k);
                    }
                });
            } catch {}
        }
    };
})();