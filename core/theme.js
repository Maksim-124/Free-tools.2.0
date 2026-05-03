/**
 * core/theme.js — управление темой (светлая/тёмная)
 */
(function() {
    window.Core = window.Core || {};

    window.Core.Theme = {
        _key: 'theme',
        _darkClass: 'dark',

        /**
         * Инициализация темы при загрузке
         */
        init() {
            const saved = this.get();
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = saved || (systemDark ? 'dark' : 'light');
            this._apply(theme);
        },

        /**
         * Переключить тему
         */
        toggle() {
            const current = this.get();
            const next = current === 'dark' ? 'light' : 'dark';
            this._apply(next);
            this.set(next);
            return next;
        },

        /**
         * Получить текущую тему
         * @returns {'light'|'dark'}
         */
        get() {
            return window.Core.Storage.get(this._key, 'light');
        },

        /**
         * Сохранить тему
         * @param {'light'|'dark'} theme
         */
        set(theme) {
            window.Core.Storage.set(this._key, theme);
        },

        /**
         * Применить тему к document.documentElement
         * @private
         */
        _apply(theme) {
            if (theme === 'dark') {
                document.documentElement.classList.add(this._darkClass);
            } else {
                document.documentElement.classList.remove(this._darkClass);
            }
        }
    };
})();