/**
 * tools/текстред/quotaMonitor.js — мониторинг квоты localStorage
 */
(function() {
window.QuotaMonitor = {
    /**
     * Проверка, влезет ли значение в localStorage
     * @param {string} key — ключ
     * @param {*} value — значение (будет сериализовано в JSON)
     * @returns {{ ok: boolean, errorMsg?: string }}
     */
    checkQuota(key, value) {
        try {
            const serialized = JSON.stringify(value);
            const testKey = '__quota_test_' + Date.now();
            
            // Пробная запись
            localStorage.setItem(testKey, serialized);
            localStorage.removeItem(testKey);
            
            return { ok: true };
        } catch (e) {
            // localStorage переполнен или недоступен
            return { 
                ok: false, 
                errorMsg: 'Недостаточно места для автосохранения. Рекомендуется скачать файл.' 
            };
        }
    },

    /**
     * Получение приблизительного использования хранилища (если поддерживается)
     * @returns {{ used: number, quota: number } | null}
     */
    getUsageEstimate() {
        if (navigator.storage && navigator.storage.estimate) {
            return navigator.storage.estimate().then(estimate => ({
                used: estimate.usage || 0,
                quota: estimate.quota || 0
            }));
        }
        return Promise.resolve(null);
    }
};
})();