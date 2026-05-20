/**
 * tools/текстред/uiManager.js — управление интерфейсом
 */
(function() {
window.UIManager = {
    /**
     * Инициализация: тема, адаптив, фокус
     */
    init() {
        // Инициализация темы
        if (window.Core?.Theme) {
            Core.Theme.init();
        }
        
        // Настройка адаптивных классов для сенсорных целей
        this._setupTouchTargets();
        
        // Обработка фокуса для экранной клавиатуры
        this._setupKeyboardFocus();
    },

    /**
     * Настройка минимального размера кликабельных элементов (44px)
     * @private
     */
    _setupTouchTargets() {
        const touchSelectors = [
            'button', 
            '[role="button"]', 
            'input[type="button"]',
            'input[type="submit"]',
            '.btn',
            '.tab-btn'
        ];
        
        touchSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const style = window.getComputedStyle(el);
                const height = parseInt(style.height) || el.offsetHeight;
                if (height < 44) {
                    el.classList.add('min-h-[44px]');
                }
            });
        });
    },

    /**
     * Управление фокусом для мобильных устройств
     * @private
     */
    _setupKeyboardFocus() {
        // При фокусе на textarea на мобильных — плавный скролл
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'TEXTAREA' && window.innerWidth < 768) {
                setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    },

    /**
     * Прокси для показа тостов
     * @param {string} msg
     * @param {number} timeoutMs
     */
    showToast(msg, timeoutMs = 2500) {
        if (window.Core?.UI?.showToast) {
            Core.UI.showToast(msg, timeoutMs);
        } else {
            // Fallback: alert для критических ошибок
            console.warn('UIManager: Core.UI.showToast недоступен', msg);
        }
    },

    /**
     * Переключение видимости элемента с анимацией
     * @param {HTMLElement} el
     * @param {boolean} show
     */
    toggleVisibility(el, show) {
        if (window.Core?.UI?.toggleVisibility) {
            Core.UI.toggleVisibility(el, show);
        } else if (el) {
            el.classList.toggle('hidden', !show);
        }
    }
};
})();