/**
 * textProcessor.js — чистая логика обработки текста для ТекстПРО
 * Экспортирует: window.TextProcessor
 * Не зависит от DOM, работает в любом контексте
 */
(function() {
    'use strict';
    
    window.TextProcessor = {
        // ═══════════════════════════════════════
        //              CLEANER
        // ═══════════════════════════════════════
        cleanText(text, options) {
            let result = text;
            const opts = {
                removeHtml: options.removeHtml !== false,
                trimSpaces: options.trimSpaces !== false,
                removeEmptyLines: !!options.removeEmptyLines,
                cleanMarkdown: !!options.cleanMarkdown,
                removeEmojis: !!options.removeEmojis,
                replaceLineBreaks: !!options.replaceLineBreaks
            };

            // Удаление HTML-тегов и декодирование сущностей
            if (opts.removeHtml) {
                result = result.replace(/<\/?[^>]+(>|$)/g, '');
                result = result.replace(/&[a-zA-Z0-9#]+;/g, match => {
                    const map = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '};
                    return map[match] || match;
                });
            }

            // Убрать лишние пробелы
            if (opts.trimSpaces) {
                result = result.replace(/[ \t]+/g, ' ').replace(/^ /gm, '').replace(/ $/gm, '');
            }

            // Удалить пустые строки
            if (opts.removeEmptyLines) {
                result = result.replace(/\n\s*\n/g, '\n').replace(/^\s+|\s+$/g, '');
            }

            // Очистка Markdown
            if (opts.cleanMarkdown) {
                result = result
                    .replace(/^#{1,6}\s+/gm, '')
                    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
                    .replace(/\*\*(.+?)\*\*/g, '$1')
                    .replace(/\*(.+?)\*/g, '$1')
                    .replace(/~~(.+?)~~/g, '$1')
                    .replace(/`(.+?)`/g, '$1')
                    .replace(/^>\s?/gm, '')
                    .replace(/^[-*_]{3,}$/gm, '')
                    .replace(/^\s*[-*+]\s+/gm, '')
                    .replace(/^\s*\d+\.\s+/gm, '')
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                    .replace(/^---$/gm, '');
            }

            // Удаление эмодзи
            if (opts.removeEmojis) {
                result = result.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu, '');
            }

            // Финальная очистка
            result = result.replace(/\n{3,}/g, '\n\n').trim();

            // Заменить переносы на пробелы
            if (opts.replaceLineBreaks) {
                result = result.replace(/\r?\n|\r/g, ' ');
            }

            return result;
        },

        // ═══════════════════════════════════════
        //            DEDUPLICATOR
        // ═══════════════════════════════════════
        deduplicate(lines, sortMode = 'none') {
            const trimmed = lines.map(l => l.trim()).filter(l => l !== '');
            const unique = [...new Set(trimmed)];
            let result = [...unique];

            if (sortMode === 'az') {
                result.sort((a, b) => a.localeCompare(b, 'ru'));
            } else if (sortMode === 'za') {
                result.sort((a, b) => b.localeCompare(a, 'ru'));
            } else if (sortMode === 'len') {
                result.sort((a, b) => b.length - a.length || a.localeCompare(b, 'ru'));
            }

            return {
                total: trimmed.length,
                unique: result.length,
                duplicates: trimmed.length - result.length,
                result
            };
        },

        // ═══════════════════════════════════════
        //              EXTRACTOR
        // ═══════════════════════════════════════
        extractData(text, options) {
            const opts = {
                emails: options.emails !== false,
                urls: options.urls !== false,
                phones: options.phones !== false
            };

            const patterns = {
                emails: { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: 'Email-адреса', icon: '📧', cls: 'email' },
                urls: { regex: /https?:\/\/[^\s<>"'`)\]},;]+/g, label: 'Ссылки', icon: '🔗', cls: 'url' },
                phones: { 
                    regex: /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?:[\s.-]?\d{2})?/g, 
                    label: 'Телефоны', icon: '📱', cls: 'phone',
                    validate: (p) => {
                        const digits = p.replace(/\D/g, '');
                        return digits.length >= 6 && digits.length <= 15;
                    }
                }
            };

            const results = {};
            let totalFound = 0;

            if (opts.emails) {
                const found = [...new Set(text.match(patterns.emails.regex) || [])];
                if (found.length) {
                    totalFound += found.length;
                    results.emails = { ...patterns.emails, items: found };
                }
            }

            if (opts.urls) {
                const found = [...new Set(text.match(patterns.urls.regex) || [])];
                if (found.length) {
                    totalFound += found.length;
                    results.urls = { ...patterns.urls, items: found };
                }
            }

            if (opts.phones) {
                let found = (text.match(patterns.phones.regex) || []).map(p => p.trim());
                found = [...new Set(found.filter(p => patterns.phones.validate(p)))];
                if (found.length) {
                    totalFound += found.length;
                    results.phones = { ...patterns.phones, items: found };
                }
            }

            return { totalFound, results };
        },

        // ═══════════════════════════════════════
        //              UTILS
        // ═══════════════════════════════════════
        countSymbols(text) {
            return text.length;
        },

        countLines(text) {
            return text.trim() ? text.split('\n').filter(l => l.trim()).length : 0;
        }
    };
})();