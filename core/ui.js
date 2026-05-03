/**
 * core/ui.js — модуль интерфейса для free-Tools 2.0
 */
(function() {
    window.Core = window.Core || {};

    window.Core.UI = {
        _toastEl: null,

        /**
         * Инициализация элемента тоста
         * @param {HTMLElement} toastEl
         */
        initToast(toastEl) {
            this._toastEl = toastEl;
        },

        /**
         * Показать уведомление
         * @param {string} msg
         * @param {number} timeoutMs
         */
        showToast(msg, timeoutMs = 2500) {
            if (!this._toastEl) return;
            this._toastEl.textContent = msg;
            this._toastEl.classList.add('show');
            setTimeout(() => {
                this._toastEl.classList.remove('show');
            }, timeoutMs);
        },

        /**
         * Анимация fade-up для элемента
         * @param {HTMLElement} el
         */
        fadeUp(el) {
            if (!el) return;
            el.style.animation = 'fadeUp 0.4s ease forwards';
        },

        /**
         * Переключение активной вкладки
         * @param {HTMLElement} activeBtn
         * @param {string} groupSelector — селектор группы кнопок
         */
        setActiveTab(activeBtn, groupSelector = '.tab-btn') {
            document.querySelectorAll(groupSelector).forEach(btn => {
                btn.classList.remove('text-indigo-600', 'border-indigo-600', 'font-semibold');
                btn.classList.add('text-gray-500');
            });
            activeBtn.classList.add('text-indigo-600', 'border-indigo-600', 'font-semibold');
            activeBtn.classList.remove('text-gray-500');
        },

        /**
         * Плавный скролл к элементу
         * @param {HTMLElement} el
         */
        scrollTo(el, offset = 0) {
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        },

        /**
         * Показать/скрыть элемент с анимацией
         * @param {HTMLElement} el
         * @param {boolean} show
         */
        toggleVisibility(el, show) {
            if (!el) return;
            if (show) {
                el.classList.remove('hidden');
                this.fadeUp(el);
            } else {
                el.classList.add('hidden');
            }
        }
    };
})();