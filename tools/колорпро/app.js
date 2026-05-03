/**
 * app.js — точка входа для КолорПРО (free-Tools 2.0)
 * Версия: 2.0.1 — добавлена диагностика загрузки зависимостей
 */
(function() {
    'use strict';
    
    let currentFile = null;
    let uiManager = null;

    function showToast(msg) {
        if (window.Core?.UI?.showToast) {
            window.Core.UI.showToast(msg);
        } else {
            // Fallback, если ядро ещё не загружено
            console.warn('Toast (fallback):', msg);
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = msg;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2500);
            }
        }
    }

    function handleFileSelection(file) {
        const validation = window.Core.IO.validateFile(file);
        if (!validation.ok) {
            showToast(`❌ ${validation.error}`);
            return;
        }
        currentFile = file;
        
        const previewImg = document.getElementById('previewImage');
        const previewContainer = document.getElementById('previewContainer');
        const previewFilename = document.getElementById('previewFilename');
        const previewDimensions = document.getElementById('previewDimensions');
        const generateBtn = document.getElementById('generateBtn');
        const resultArea = document.getElementById('resultArea');

        window.Core.IO.previewImage(file, previewImg, (w, h) => {
            previewDimensions.textContent = `${w} × ${h} px`;
        });
        previewFilename.textContent = file.name;
        
        if (previewContainer) previewContainer.classList.remove('hidden');
        if (generateBtn) generateBtn.disabled = false;
        if (resultArea) resultArea.classList.add('hidden');
    }

    async function generatePaletteAndTheme() {
        if (!currentFile) {
            showToast('Сначала загрузите изображение');
            return;
        }
        const generateBtn = document.getElementById('generateBtn');
        if (!generateBtn) return;
        
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Анализируем...';

        try {
            if (!window.ColorExtractor?.extractPaletteFromFile) {
                throw new Error('ColorExtractor не загружен');
            }
            
            const hexColors = await window.ColorExtractor.extractPaletteFromFile(currentFile);
            const { primary, secondary, accent, text } = window.ColorExtractor.autoSelectColors(hexColors);
            
            if (!uiManager) {
                throw new Error('UIManager не инициализирован');
            }
            
            uiManager.setColors(primary, secondary, accent, text);
            uiManager.renderPalette(
                hexColors,
                uiManager.currentAccent,
                (newAccentHex, card) => {
                    uiManager.setAccent(newAccentHex);
                    document.querySelectorAll('#paletteGrid .flex-1').forEach(c => c.classList.remove('active-accent'));
                    card.classList.add('active-accent');
                    showToast(`🎨 Акцент: ${newAccentHex}`);
                },
                (hex) => window.Core.IO.copyToClipboard(hex)
            );
            
            const resultArea = document.getElementById('resultArea');
            if (resultArea) {
                resultArea.classList.remove('hidden');
                if (window.Core?.UI?.scrollTo) {
                    window.Core.UI.scrollTo(resultArea, 20);
                }
            }
            showToast(`🎨 Готово! ${hexColors.length} цветов`);
        } catch (err) {
            console.error('❌ Ошибка генерации палитры:', err);
            showToast('❌ Ошибка анализа. Попробуйте другое изображение');
            document.getElementById('resultArea')?.classList.add('hidden');
        } finally {
            const btn = document.getElementById('generateBtn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✨ Извлечь палитру и тему';
            }
        }
    }

    function clearAll() {
        currentFile = null;
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        
        if (window.Core?.UI) {
            window.Core.UI.toggleVisibility(document.getElementById('previewContainer'), false);
            window.Core.UI.toggleVisibility(document.getElementById('resultArea'), false);
        }
        
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) generateBtn.disabled = true;
        if (uiManager) uiManager.hexPalette = [];
        showToast('🗑️ Очищено');
    }

    // === ГЛАВНАЯ ТОЧКА ВХОДА ===
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔍 Диагностика загрузки зависимостей:');
        console.log('  - window.Core:', !!window.Core);
        console.log('  - window.Core.IO:', !!window.Core?.IO);
        console.log('  - window.Core.UI:', !!window.Core?.UI);
        console.log('  - window.ColorExtractor:', !!window.ColorExtractor);
        console.log('  - window.UIManager:', !!window.UIManager);
        console.log('  - ColorThief:', typeof ColorThief);

        // Проверка критических зависимостей
        if (!window.Core?.IO) {
            console.error('❌ Критическая ошибка: Core.IO не загружен. Проверьте пути к core/io.js');
            showToast('⚠️ Ошибка загрузки ядра. Проверьте консоль (F12)');
            return;
        }
        if (!window.UIManager) {
            console.error('❌ Критическая ошибка: UIManager не определён. Проверьте uiManager.js');
            showToast('⚠️ Ошибка загрузки интерфейса. Проверьте консоль (F12)');
            return;
        }
        if (!window.ColorExtractor) {
            console.error('❌ Критическая ошибка: ColorExtractor не загружен');
            showToast('⚠️ Ошибка загрузки логики цвета');
            return;
        }

        try {
            // Инициализация ядра
            if (window.Core?.UI) window.Core.UI.initToast(document.getElementById('toast'));
            if (window.Core?.Theme) window.Core.Theme.init();

            // Инициализация менеджера
            uiManager = new UIManager();
            console.log('✅ UIManager успешно создан');

            // Привязка Drag & Drop
            window.Core.IO.setupDropzone(
                document.getElementById('dropzone'),
                document.getElementById('fileInput'),
                handleFileSelection
            );
            console.log('✅ Drag&Drop инициализирован');

            // Кнопки
            document.getElementById('generateBtn')?.addEventListener('click', generatePaletteAndTheme);
            document.getElementById('clearBtn')?.addEventListener('click', clearAll);
            document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
                const code = uiManager?.codePanel?.textContent || '';
                window.Core.IO.copyToClipboard(code).then(res => {
                    showToast(res.ok ? '📋 Код скопирован' : `❌ ${res.error}`);
                });
            });

            console.log('✅ КолорПро 2.0 успешно инициализирован');
        } catch (err) {
            console.error('💥 Критическая ошибка при инициализации:', err);
            showToast('⚠️ Ошибка запуска. Откройте консоль (F12) для деталей');
        }
    });
// === DEBUG: проверка клика по dropzone ===
setTimeout(() => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropzone) {
        dropzone.addEventListener('click', (e) => {
            console.log('🖱️ Клик по dropzone:', { 
                target: e.target.id, 
                classList: Array.from(e.target.classList) 
            });
        }, true); // useCapture = true, чтобы поймать событие раньше
    }
    
    if (fileInput) {
        fileInput.addEventListener('click', () => {
            console.log('📂 fileInput.click() сработал');
        });
        fileInput.addEventListener('change', (e) => {
            console.log('✅ Файл выбран:', e.target.files[0]?.name);
        });
    }
    
    console.log('🔎 Состояние элементов:', {
        dropzone: dropzone ? {
            offsetParent: dropzone.offsetParent, // null = скрыт через display:none
            pointerEvents: getComputedStyle(dropzone).pointerEvents,
            zIndex: getComputedStyle(dropzone).zIndex
        } : null,
        fileInput: fileInput ? {
            hidden: fileInput.classList.contains('hidden'),
            display: getComputedStyle(fileInput).display,
            disabled: fileInput.disabled
        } : null
    });
}, 1000);
})();