/**
 * app.js — точка входа для ТекстПРО (free-Tools 2.0)
 * Тонкий контроллер: связывает UI, Core.* и TextProcessor
 */
(function() {
    'use strict';
    
    // ═══════════════════════════════════════
    //              STATE
    // ═══════════════════════════════════════
    let dedupSort = 'none';
    const tools = ['cleaner', 'dedup', 'extractor'];

    // ═══════════════════════════════════════
    //              HELPERS
    // ═══════════════════════════════════════
    function showToast(msg) {
        window.Core.UI.showToast(msg);
    }

    function toggleCheck(el) {
        const cb = el.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.checked = !cb.checked;
            el.classList.toggle('checked', cb.checked);
        }
    }

    function updateCount(tool) {
        const ta = document.getElementById(tool + '-input');
        const counter = document.getElementById(tool + '-count');
        if (!ta || !counter) return;
        
        if (tool === 'dedup') {
            const lines = window.TextProcessor.countLines(ta.value);
            counter.textContent = lines + ' строк';
        } else {
            counter.textContent = window.TextProcessor.countSymbols(ta.value) + ' символов';
        }
    }

    function switchTool(name) {
        document.querySelectorAll('.tool-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tool === name);
        });
        document.querySelectorAll('.tool-section').forEach(s => {
            s.classList.toggle('active', s.id === 'tool-' + name);
        });
    }

    function clearField(tool) {
        const input = document.getElementById(tool + '-input');
        if (input) input.value = '';
        updateCount(tool);
        const resultCard = document.getElementById(tool + '-result-card');
        if (resultCard) resultCard.style.display = 'none';
        showToast('🗑️ Очищено');
    }

    async function copyText(text) {
        const res = await window.Core.IO.copyToClipboard(text);
        showToast(res.ok ? '✅ Скопировано' : `❌ ${res.error}`);
        return res.ok;
    }

    function downloadText(text, filename) {
        window.Core.IO.downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
        showToast('💾 Файл скачан');
    }

    // ═══════════════════════════════════════
    //           TOOL 1: CLEANER
    // ═══════════════════════════════════════
    function processCleaner() {
        const input = document.getElementById('cleaner-input')?.value || '';
        if (!input.trim()) { showToast('⚠️ Введите текст для очистки'); return; }

        const checks = document.querySelectorAll('#cleaner-options .option-check');
        const options = {
            removeHtml: checks[0]?.classList.contains('checked'),
            trimSpaces: checks[1]?.classList.contains('checked'),
            removeEmptyLines: checks[2]?.classList.contains('checked'),
            cleanMarkdown: checks[3]?.classList.contains('checked'),
            removeEmojis: checks[4]?.classList.contains('checked'),
            replaceLineBreaks: checks[5]?.classList.contains('checked')
        };

        const originalLen = input.length;
        const result = window.TextProcessor.cleanText(input, options);
        const removed = originalLen - result.length;

        const resultEl = document.getElementById('cleaner-result');
        if (resultEl) resultEl.textContent = result;

        const stats = document.getElementById('cleaner-stats');
        if (stats) {
            stats.innerHTML = `
                <span class="stat blue">Было: ${originalLen} символов</span>
                <span class="stat green">Стало: ${result.length} символов</span>
                ${removed > 0 ? `<span class="stat amber">Удалено: ${removed} символов</span>` : ''}
            `;
        }

        const resultCard = document.getElementById('cleaner-result-card');
        if (resultCard) {
            resultCard.style.display = 'block';
            window.Core.UI.scrollTo(resultCard, 20);
        }
        showToast('✅ Текст очищен');
    }

    // ═══════════════════════════════════════
    //         TOOL 2: DEDUPLICATOR
    // ═══════════════════════════════════════
    function processDedup() {
        const input = document.getElementById('dedup-input')?.value || '';
        if (!input.trim()) { showToast('⚠️ Вставьте список'); return; }

        const lines = input.split('\n');
        const { total, unique, duplicates, result } = window.TextProcessor.deduplicate(lines, dedupSort);

        const resultEl = document.getElementById('dedup-result');
        if (resultEl) resultEl.textContent = result.join('\n');

        const stats = document.getElementById('dedup-stats');
        if (stats) {
            stats.innerHTML = `
                <span class="stat blue">Всего строк: ${total}</span>
                <span class="stat green">Уникальных: ${unique}</span>
                ${duplicates > 0 ? `<span class="stat amber">Дубликатов удалено: ${duplicates}</span>` : ''}
            `;
        }

        const resultCard = document.getElementById('dedup-result-card');
        if (resultCard) {
            resultCard.style.display = 'block';
            window.Core.UI.scrollTo(resultCard, 20);
        }
        showToast(`✅ Удалено ${duplicates} дубликатов`);
    }

    // ═══════════════════════════════════════
    //          TOOL 3: EXTRACTOR
    // ═══════════════════════════════════════
    function processExtractor() {
        const input = document.getElementById('extractor-input')?.value || '';
        if (!input.trim()) { showToast('⚠️ Вставьте текст'); return; }

        const checks = document.querySelectorAll('#extractor-options .option-check');
        const options = {
            emails: checks[0]?.classList.contains('checked'),
            urls: checks[1]?.classList.contains('checked'),
            phones: checks[2]?.classList.contains('checked')
        };

        const { totalFound, results } = window.TextProcessor.extractData(input, options);
        const container = document.getElementById('extractor-results');
        if (!container) return;
        
        container.innerHTML = '';

        if (totalFound === 0) {
            container.innerHTML = '<div class="empty-state"><p>Ничего не найдено. Попробуйте изменить параметры поиска.</p></div>';
        } else {
            Object.values(results).forEach(pattern => {
                const tags = pattern.items.map(item => {
                    const safeItem = item.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    return `<span class="extract-tag ${pattern.cls}" data-copy="${safeItem}">${item}<span class="copy-icon">📋</span></span>`;
                }).join('');
                
                container.innerHTML += `
                    <div style="margin-bottom:20px">
                        <div style="font-size:14px;font-weight:700;margin-bottom:10px">
                            ${pattern.icon} ${pattern.label} <span style="color:var(--text-muted);font-weight:400;font-size:13px">(${pattern.items.length})</span>
                        </div>
                        <div class="extract-result">${tags}</div>
                    </div>
                `;
            });
        }

        const stats = document.getElementById('extractor-stats');
        if (stats) stats.innerHTML = `<span class="stat green">Найдено: ${totalFound}</span>`;
        
        const resultCard = document.getElementById('extractor-result-card');
        if (resultCard) {
            resultCard.style.display = 'block';
            window.Core.UI.scrollTo(resultCard, 20);
        }
        
        showToast(totalFound > 0 ? `🎯 Найдено ${totalFound} элементов` : '⚠️ Ничего не найдено');
    }

    function copyAllExtractor() {
        const container = document.getElementById('extractor-results');
        if (!container) return;
        
        const tags = container.querySelectorAll('.extract-tag');
        const text = [...tags].map(t => t.getAttribute('data-copy') || t.textContent.replace('📋', '').trim()).join('\n');
        
        if (text) copyText(text);
    }

    // ═══════════════════════════════════════
    //              INIT
    // ═══════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        // Инициализация ядра
        if (window.Core?.UI) window.Core.UI.initToast(document.getElementById('toast'));
        if (window.Core?.Theme) window.Core.Theme.init();

        // Обработчики переключения вкладок
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.addEventListener('click', () => switchTool(tab.dataset.tool));
        });

        // Обработчики чекбоксов
        document.querySelectorAll('.option-check').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') toggleCheck(el);
            });
        });

        // Счётчики символов/строк
        tools.forEach(tool => {
            const ta = document.getElementById(tool + '-input');
            if (ta) {
                ta.addEventListener('input', () => updateCount(tool));
                updateCount(tool);
            }
        });

        // Кнопки очистки полей
        document.getElementById('cleaner-clear')?.addEventListener('click', () => clearField('cleaner'));
        document.getElementById('dedup-clear')?.addEventListener('click', () => clearField('dedup'));
        document.getElementById('extractor-clear')?.addEventListener('click', () => clearField('extractor'));

        // Кнопки обработки
        document.getElementById('cleaner-btn')?.addEventListener('click', processCleaner);
        document.getElementById('dedup-btn')?.addEventListener('click', processDedup);
        document.getElementById('extractor-btn')?.addEventListener('click', processExtractor);

        // Копирование и скачивание (Cleaner)
        document.getElementById('cleaner-copy')?.addEventListener('click', () => {
            const text = document.getElementById('cleaner-result')?.textContent || '';
            if (text) copyText(text);
        });
        document.getElementById('cleaner-download')?.addEventListener('click', () => {
            const text = document.getElementById('cleaner-result')?.textContent || '';
            if (text) downloadText(text, 'cleaned-text.txt');
        });

        // Копирование и скачивание (Dedup)
        document.getElementById('dedup-copy')?.addEventListener('click', () => {
            const text = document.getElementById('dedup-result')?.textContent || '';
            if (text) copyText(text);
        });
        document.getElementById('dedup-download')?.addEventListener('click', () => {
            const text = document.getElementById('dedup-result')?.textContent || '';
            if (text) downloadText(text, 'unique-list.txt');
        });

        // Копирование всего (Extractor)
        document.getElementById('extractor-copy-all')?.addEventListener('click', copyAllExtractor);

        // Делегирование: копирование отдельного тега в экстракторе
        document.getElementById('extractor-results')?.addEventListener('click', (e) => {
            const tag = e.target.closest('.extract-tag');
            if (tag && e.target.classList.contains('copy-icon')) {
                const text = tag.getAttribute('data-copy');
                if (text) copyText(text);
            }
        });

        // Сортировка в дедупликаторе
        document.querySelectorAll('#tool-dedup .sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#tool-dedup .sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                dedupSort = btn.dataset.sort;
            });
        });

        console.log('✅ ТекстПро 2.0 успешно инициализирован');
    });

    // Экспорт для отладки
    window.TextProApp = { switchTool, processCleaner, processDedup, processExtractor };
})();