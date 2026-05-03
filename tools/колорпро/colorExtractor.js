/**
 * colorExtractor.js — логика извлечения палитры из изображения
 * Экспортирует: window.ColorExtractor
 */
window.ColorExtractor = (function() {
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }

    function rgbToHue(r, g, b) {
        const rf = r / 255, gf = g / 255, bf = b / 255;
        const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
        let hue = 0;
        if (max === min) return 0;
        const d = max - min;
        switch (max) {
            case rf: hue = (gf - bf) / d + (gf < bf ? 6 : 0); break;
            case gf: hue = (bf - rf) / d + 2; break;
            case bf: hue = (rf - gf) / d + 4; break;
        }
        return hue * 60;
    }

    function getSaturationAndValue(r, g, b) {
        const rf = r / 255, gf = g / 255, bf = b / 255;
        const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
        const value = max;
        let saturation = 0;
        if (max !== 0) saturation = (max - min) / max;
        return { saturation, value };
    }

    function autoSelectColors(hexColors) {
        if (!hexColors?.length) {
            return { primary: '#4f46e5', secondary: '#06b6d4', accent: '#f59e0b', text: '#1e1b4b' };
        }

        const colorsData = hexColors.map(hex => {
            const rgb = hexToRgb(hex);
            const { saturation, value } = getSaturationAndValue(rgb.r, rgb.g, rgb.b);
            const hue = rgbToHue(rgb.r, rgb.g, rgb.b);
            return { hex, saturation, value, hue };
        });

        // Primary: самый насыщенный (при равенстве — более яркий)
        const sortedBySat = [...colorsData].sort((a, b) => {
            if (Math.abs(b.saturation - a.saturation) < 0.05) return b.value - a.value;
            return b.saturation - a.saturation;
        });
        const primary = sortedBySat[0].hex;

        // Secondary: второй по насыщенности, не равный primary
        let secondary = sortedBySat[1]?.hex || primary;
        if (secondary === primary && sortedBySat[2]) secondary = sortedBySat[2].hex;

        // Accent: среди насыщенных — максимальное отличие по тону от primary
        const saturated = colorsData.filter(c => c.saturation > 0.3 && c.hex !== primary);
        let accent = saturated.length ? saturated[0] : null;
        if (accent) {
            const primaryHue = colorsData.find(c => c.hex === primary).hue;
            let bestDiff = 0;
            for (const col of saturated) {
                let diff = Math.abs(col.hue - primaryHue);
                diff = Math.min(diff, 360 - diff);
                if (diff > bestDiff) {
                    bestDiff = diff;
                    accent = col;
                }
            }
            accent = accent.hex;
        } else {
            accent = sortedBySat.find(c => c.hex !== primary)?.hex || primary;
        }

        // Text: самый тёмный цвет (или фолбэк)
        const sortedByValue = [...colorsData].sort((a, b) => a.value - b.value);
        let text = sortedByValue[0].hex;
        if (hexToRgb(text).value > 0.5) text = '#1e1b4b';

        return { primary, secondary, accent, text };
    }

    async function extractPaletteFromFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 400;
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        let r = data[i], g = data[i + 1], b = data[i + 2];
                        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                        const factor = 1.2;
                        r = r + (r - gray) * (factor - 1);
                        g = g + (g - gray) * (factor - 1);
                        b = b + (b - gray) * (factor - 1);
                        data[i] = Math.min(255, Math.max(0, r));
                        data[i + 1] = Math.min(255, Math.max(0, g));
                        data[i + 2] = Math.min(255, Math.max(0, b));
                    }
                    ctx.putImageData(imageData, 0, 0);

                    // ColorThief должен быть подключён глобально
                    if (typeof ColorThief === 'undefined') {
                        throw new Error('ColorThief не загружен');
                    }
                    const colorThief = new ColorThief();
                    const paletteRgb = colorThief.getPalette(canvas, 12, 3);
                    if (!paletteRgb || paletteRgb.length === 0) {
                        throw new Error('Палитра не найдена');
                    }
                    const hexColors = paletteRgb.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
                    resolve(hexColors);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
            img.src = url;
        });
    }

    return {
        rgbToHex,
        hexToRgb,
        rgbToHue,
        getSaturationAndValue,
        autoSelectColors,
        extractPaletteFromFile
    };
})();