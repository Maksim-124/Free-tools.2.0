/**
 * core/io.js — модуль ввода/вывода для free-Tools 2.0
 * Исправлено: надёжная привязка событий, защита от блокировок file://
 */
(function() {
    window.Core = window.Core || {};

    window.Core.IO = {
        validateFile(file, maxSizeMB = 10, allowedTypes = ['image/png', 'image/jpeg', 'image/webp']) {
            if (!file) return { ok: false, error: 'Файл не выбран' };
            if (file.size > maxSizeMB * 1024 * 1024) {
                return { ok: false, error: `Файл слишком большой (макс. ${maxSizeMB} МБ)` };
            }
            if (!allowedTypes.includes(file.type)) {
                return { ok: false, error: `Неподдерживаемый формат. Разрешены: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}` };
            }
            return { ok: true };
        },

setupDropzone(dropzoneEl, fileInputEl, onFileSelected) {
    if (!dropzoneEl || !fileInputEl) {
        console.error('Core.IO: Элементы dropzone или fileInput не найдены в DOM');
        return;
    }

    // Drag & Drop для визуальной обратной связи
    ['dragover', 'dragenter'].forEach(evt => {
        dropzoneEl.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzoneEl.classList.add('drag-over');
        });
    });
    ['dragleave', 'drop'].forEach(evt => {
        dropzoneEl.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzoneEl.classList.remove('drag-over');
        });
    });

    // Обработка drop
    dropzoneEl.addEventListener('drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file && typeof onFileSelected === 'function') {
            onFileSelected(file);
        }
    });

    // Обработка выбора файла (срабатывает при клике на overlay-input)
    fileInputEl.addEventListener('change', (e) => {
        const file = fileInputEl.files?.[0];
        if (file && typeof onFileSelected === 'function') {
            onFileSelected(file);
            fileInputEl.value = ''; // сброс для повторного выбора
        }
    });
},

        previewImage(file, imgEl, onLoaded) {
            if (!file || !imgEl) return;
            const objectUrl = URL.createObjectURL(file);
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                URL.revokeObjectURL(objectUrl);
                if (typeof onLoaded === 'function') onLoaded(imgEl.naturalWidth, imgEl.naturalHeight);
            };
            imgEl.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                console.error('Не удалось загрузить превью');
            };
        },

        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                return { ok: true };
            } catch {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                try {
                    const success = document.execCommand('copy');
                    document.body.removeChild(ta);
                    return success ? { ok: true } : { ok: false, error: 'Не удалось скопировать' };
                } catch {
                    document.body.removeChild(ta);
                    return { ok: false, error: 'Clipboard API недоступен' };
                }
            }
        },

        downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
    };
})();