/**
 * app.js — точка входа для FaviconПРО (free-Tools 2.0)
 * Тонкий контроллер: связывает UI, Core.* и FaviconGenerator
 */
(function() {
    'use strict';
    
    // ═══════════════════════════════════════
    //              STATE
    // ═══════════════════════════════════════
    let selectedSizes = new Set(window.FaviconGenerator.defaultSizes);
    let currentImageFile = null;
    let currentImageBitmap = null;
    let generatedBlobs = new Map(); // size -> Blob
    let generatedUrls = new Map();  // size -> objectURL (для cleanup)

    // ═══════════════════════════════════════
    //              DOM
    // ═══════════════════════════════════════
    const els = {
        sizesContainer: document.getElementById('sizes-options'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        deselectAllBtn: document.getElementById('deselectAllBtn'),
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('fileInput'),
        previewContainer: document.getElementById('previewContainer'),
        previewImage: document.getElementById('previewImage'),
        previewFilename: document.getElementById('previewFilename'),
        previewDimensions: document.getElementById('previewDimensions'),
        generateBtn: document.getElementById('generateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        resultArea: document.getElementById('resultArea'),
        iconGallery: document.getElementById('iconGallery'),
        downloadZipBtn: document.getElementById('downloadZipBtn'),
        progressBar: document.getElementById('progressBar'),
        progressFill: document.getElementById('progressFill'),
        toast: document.getElementById('toast')
    };

    // ═══════════════════════════════════════
    //              HELPERS
    // ═══════════════════════════════════════
    function showToast(msg) {
        window.Core.UI.showToast(msg);
    }

    function updateProgress(percent) {
        if (!els.progressBar || !els.progressFill) return;
        els.progressBar.style.display = 'block';
        els.progressFill.style.width = percent + '%';
        if (percent >= 100) {
            setTimeout(() => { els.progressBar.style.display = 'none'; }, 500);
        }
    }

    function renderSizeOptions() {
        if (!els.sizesContainer) return;
        els.sizesContainer.innerHTML = '';
        
        for (const size of window.FaviconGenerator.defaultSizes) {
            const isChecked = selectedSizes.has(size);
            const hint = window.FaviconGenerator.getSizeHint(size);
            
            const optionDiv = document.createElement('div');
            optionDiv.className = `option-check ${isChecked ? 'checked' : ''}`;
            optionDiv.setAttribute('data-size', size);
            optionDiv.innerHTML = `
                <input type="checkbox" ${isChecked ? 'checked' : ''}>
                <span class="check-box"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
                <div>
                    <div class="option-label">${size} × ${size} px</div>
                    <div class="option-hint">${hint}</div>
                </div>
            `;
            
            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                const cb = optionDiv.querySelector('input');
                cb.checked = !cb.checked;
                
                if (cb.checked) {
                    selectedSizes.add(size);
                    optionDiv.classList.add('checked');
                } else {
                    selectedSizes.delete(size);
                    optionDiv.classList.remove('checked');
                }
                // Обновляем состояние кнопки генерации
                if (els.generateBtn) {
                    els.generateBtn.disabled = (selectedSizes.size === 0) || !currentImageBitmap;
                }
            });
            
            els.sizesContainer.appendChild(optionDiv);
        }
    }

    function selectAllSizes() {
        selectedSizes = new Set(window.FaviconGenerator.defaultSizes);
        renderSizeOptions();
        if (els.generateBtn) els.generateBtn.disabled = !currentImageBitmap;
    }

    function deselectAllSizes() {
        selectedSizes.clear();
        renderSizeOptions();
        if (els.generateBtn) els.generateBtn.disabled = true;
    }

    async function handleFile(file) {
        if (!file) return;
        
        const validation = window.Core.IO.validateFile(file, 10, ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
        if (!validation.ok) {
            showToast(`❌ ${validation.error}`);
            return;
        }
        
        currentImageFile = file;
        
        // Превью
        window.Core.IO.previewImage(file, els.previewImage, (w, h) => {
            if (els.previewDimensions) els.previewDimensions.textContent = `${w} × ${h} px`;
        });
        if (els.previewFilename) els.previewFilename.textContent = file.name;
        if (els.previewContainer) els.previewContainer.style.display = 'block';
        
        // Создаём ImageBitmap для генерации
        try {
            if (currentImageBitmap) currentImageBitmap.close();
            currentImageBitmap = await window.FaviconGenerator.loadImageBitmap(file);
            if (els.generateBtn) {
                els.generateBtn.disabled = (selectedSizes.size === 0);
            }
        } catch (err) {
            console.error('Ошибка загрузки изображения:', err);
            showToast('❌ Не удалось декодировать изображение');
            if (els.generateBtn) els.generateBtn.disabled = true;
        }
    }

    function clearAll() {
        // Очистка ресурсов
        if (currentImageBitmap) {
            currentImageBitmap.close();
            currentImageBitmap = null;
        }
        // Отзываем object URLs
        for (const url of generatedUrls.values()) {
            URL.revokeObjectURL(url);
        }
        generatedUrls.clear();
        generatedBlobs.clear();
        
        // Сброс UI
        currentImageFile = null;
        if (els.previewContainer) els.previewContainer.style.display = 'none';
        if (els.resultArea) els.resultArea.style.display = 'none';
        if (els.iconGallery) els.iconGallery.innerHTML = '';
        if (els.generateBtn) els.generateBtn.disabled = true;
        if (els.fileInput) els.fileInput.value = '';
        
        showToast('🗑️ Очищено');
    }

    async function generateFavicons() {
        if (!currentImageBitmap || selectedSizes.size === 0) {
            showToast('⚠️ Сначала выберите размеры и загрузите изображение');
            return;
        }
        
        if (els.generateBtn) {
            els.generateBtn.disabled = true;
            els.generateBtn.textContent = '⏳ Генерация...';
        }
        
        try {
            // Очистка предыдущих URL
            for (const url of generatedUrls.values()) {
                URL.revokeObjectURL(url);
            }
            generatedUrls.clear();
            generatedBlobs.clear();
            
            updateProgress(0);
            
            const blobs = await window.FaviconGenerator.generateSet(
                currentImageBitmap,
                Array.from(selectedSizes),
                updateProgress
            );
            
            generatedBlobs = blobs;
            displayGallery();
            
            if (els.resultArea) {
                els.resultArea.style.display = 'block';
                window.Core.UI.scrollTo(els.resultArea, 20);
            }
            showToast(`✅ Сгенерировано ${blobs.size} иконок`);
        } catch (err) {
            console.error('Ошибка генерации:', err);
            showToast('❌ Ошибка при генерации. Попробуйте другое изображение');
        } finally {
            if (els.generateBtn) {
                els.generateBtn.disabled = false;
                els.generateBtn.textContent = '✨ Сгенерировать фавиконы';
            }
        }
    }

    function displayGallery() {
        if (!els.iconGallery) return;
        els.iconGallery.innerHTML = '';
        
        const sorted = Array.from(generatedBlobs.keys()).sort((a, b) => a - b);
        
        for (const size of sorted) {
            const blob = generatedBlobs.get(size);
            if (!blob) continue;
            
            const url = URL.createObjectURL(blob);
            generatedUrls.set(size, url);
            
            const card = document.createElement('div');
            card.className = 'icon-card';
            card.setAttribute('data-size', size);
            card.innerHTML = `
                <div class="icon-preview"><img src="${url}" alt="${size}×${size}"></div>
                <div class="icon-label">${size}×${size}</div>
                <div class="icon-size">PNG</div>
            `;
            
            // Клик по карточке → скачать один файл
            card.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `favicon-${size}x${size}.png`;
                link.click();
                showToast(`📥 Скачан favicon-${size}x${size}.png`);
            });
            
            els.iconGallery.appendChild(card);
        }
    }

    async function downloadAllAsZip() {
        if (generatedBlobs.size === 0) {
            showToast('Нет сгенерированных иконок');
            return;
        }
        
        try {
            const zipBlob = await window.FaviconGenerator.createZip(generatedBlobs);
            window.Core.IO.downloadBlob(zipBlob, 'favicons.zip');
            showToast('📦 Архив favicons.zip скачан');
        } catch (err) {
            console.error('Ошибка создания ZIP:', err);
            showToast('❌ Не удалось создать архив');
        }
    }

    // ═══════════════════════════════════════
    //              INIT
    // ═══════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        // Инициализация ядра
        if (window.Core?.UI) window.Core.UI.initToast(els.toast);
        if (window.Core?.Theme) window.Core.Theme.init();
        
        // Рендер опций размеров
        renderSizeOptions();
        
        // Кнопки выбора размеров
        els.selectAllBtn?.addEventListener('click', selectAllSizes);
        els.deselectAllBtn?.addEventListener('click', deselectAllSizes);
        
        // Drag & Drop
        window.Core.IO.setupDropzone(els.dropzone, els.fileInput, handleFile);
        
        // Кнопки действий
        els.generateBtn?.addEventListener('click', generateFavicons);
        els.clearBtn?.addEventListener('click', clearAll);
        els.downloadZipBtn?.addEventListener('click', downloadAllAsZip);
        
        // Стартовое состояние
        if (els.generateBtn) els.generateBtn.disabled = true;
        
        console.log('✅ FaviconПРО 2.0 успешно инициализирован');
    });
    
    // Экспорт для отладки
    window.FaviconProApp = { generateFavicons, clearAll, downloadAllAsZip };
})();