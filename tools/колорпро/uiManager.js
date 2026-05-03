/**
 * uiManager.js — управление интерфейсом КолорПРО
 * Экспортирует: window.UIManager (класс)
 * Версия: 2.0.1 — исправлен экспорт для file://
 */
(function() {
    'use strict';
    
    // Гарантированный экспорт в глобальную область
    window.UIManager = class UIManager {
        constructor() {
            // Кэшируем элементы
            this.paletteGrid = document.getElementById('paletteGrid');
            this.codePanel = document.getElementById('codePanel');
            this.tabTailwindBtn = document.getElementById('tabTailwindBtn');
            this.tabCssBtn = document.getElementById('tabCssBtn');

            // Демо-интерфейс
            this.navLogo = document.getElementById('navLogo');
            this.navLink1 = document.getElementById('navLink1');
            this.demoNavBtn = document.getElementById('demoNavBtn');
            this.cardGradient = document.getElementById('cardGradient');
            this.cardTitle = document.getElementById('cardTitle');
            this.cardPrice = document.getElementById('cardPrice');
            this.cardButton = document.getElementById('cardButton');
            this.avatarBadge = document.getElementById('avatarBadge');
            this.tagPrimary = document.getElementById('tagPrimary');
            this.subscribeBlock = document.getElementById('subscribeBlock');
            this.subscribeBtn = document.getElementById('subscribeBtn');
            this.likeHeartNew = document.getElementById('likeHeartNew');
            this.likeCountSpan = document.getElementById('likeCount');

            // Состояние
            this.hexPalette = [];
            this.currentPrimary = '#4f46e5';
            this.currentSecondary = '#06b6d4';
            this.currentAccent = '#f59e0b';
            this.currentText = '#1e1b4b';
            this.currentCodeMode = 'tailwind';
            this.isLiked = false;
            this.likeCount = 0;

            // Привязка методов
            this.switchCodeTab = this.switchCodeTab.bind(this);
            this.updateUIAndCode = this.updateUIAndCode.bind(this);

            // Инициализация вкладок
            if (this.tabTailwindBtn) {
                this.tabTailwindBtn.addEventListener('click', () => this.switchCodeTab('tailwind'));
            }
            if (this.tabCssBtn) {
                this.tabCssBtn.addEventListener('click', () => this.switchCodeTab('css'));
            }

            // Инициализация лайка
            this.initLikeButton();
            
            // Первичная отрисовка
            this.updateUIAndCode();
        }

        initLikeButton() {
            if (!this.likeHeartNew) return;
            this.likeHeartNew.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.isLiked) {
                    this.isLiked = true;
                    this.likeCount++;
                    this.likeHeartNew.style.color = this.currentAccent;
                    const path = this.likeHeartNew.querySelector('path');
                    if (path) path.setAttribute('fill', this.currentAccent);
                    this.likeHeartNew.classList.add('liked');
                } else {
                    this.isLiked = false;
                    this.likeCount = Math.max(0, this.likeCount - 1);
                    this.likeHeartNew.style.color = '';
                    const path = this.likeHeartNew.querySelector('path');
                    if (path) path.setAttribute('fill', 'none');
                    this.likeHeartNew.classList.remove('liked');
                }
                if (this.likeCountSpan) this.likeCountSpan.textContent = this.likeCount;
                // Микро-анимация
                this.likeHeartNew.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    if (this.likeHeartNew) this.likeHeartNew.style.transform = '';
                }, 200);
            });
        }

        updateUIAndCode() {
            // Навигация
            if (this.navLogo) this.navLogo.style.backgroundColor = this.currentPrimary;
            if (this.navLink1) this.navLink1.style.color = this.currentPrimary;
            if (this.demoNavBtn) this.demoNavBtn.style.backgroundColor = this.currentAccent;

            // Карточка товара
            if (this.cardGradient) {
                this.cardGradient.style.background = `linear-gradient(135deg, ${this.currentPrimary}, ${this.currentAccent})`;
            }
            if (this.cardTitle) this.cardTitle.style.color = this.currentText;
            if (this.cardPrice) this.cardPrice.style.color = this.currentPrimary;
            if (this.cardButton) this.cardButton.style.backgroundColor = this.currentPrimary;

            // Аватар / теги
            if (this.avatarBadge) this.avatarBadge.style.backgroundColor = this.currentPrimary;
            if (this.tagPrimary) {
                this.tagPrimary.style.backgroundColor = this.currentPrimary;
                this.tagPrimary.style.color = '#fff';
            }

            // Форма подписки
            if (this.subscribeBlock) {
                this.subscribeBlock.style.background = `linear-gradient(135deg, ${this.currentPrimary}, ${this.currentAccent})`;
            }
            if (this.subscribeBtn) {
                this.subscribeBtn.style.backgroundColor = '#fff';
                this.subscribeBtn.style.color = this.currentPrimary;
            }

            // Лайк: обновить цвет при смене акцента
            if (this.isLiked && this.likeHeartNew) {
                this.likeHeartNew.style.color = this.currentAccent;
                const path = this.likeHeartNew.querySelector('path');
                if (path) path.setAttribute('fill', this.currentAccent);
            }

            // Генерация кода
            this.currentTailwindCode = `module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${this.currentPrimary}',
        secondary: '${this.currentSecondary}',
        accent: '${this.currentAccent}',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '${this.currentText}'
      }
    }
  }
}`;
            this.currentCssCode = `:root {
  --color-primary: ${this.currentPrimary};
  --color-secondary: ${this.currentSecondary};
  --color-accent: ${this.currentAccent};
  --color-surface: #ffffff;
  --color-text: ${this.currentText};
  --color-border: #e2e5f1;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1rem;
}`;
            // Обновляем панель кода
            if (this.codePanel) {
                this.codePanel.textContent = this.currentCodeMode === 'tailwind' 
                    ? this.currentTailwindCode 
                    : this.currentCssCode;
            }
        }

        switchCodeTab(mode) {
            this.currentCodeMode = mode;
            if (mode === 'tailwind') {
                if (this.codePanel) this.codePanel.textContent = this.currentTailwindCode;
                if (window.Core?.UI?.setActiveTab && this.tabTailwindBtn) {
                    window.Core.UI.setActiveTab(this.tabTailwindBtn, '.tab-btn');
                }
            } else {
                if (this.codePanel) this.codePanel.textContent = this.currentCssCode;
                if (window.Core?.UI?.setActiveTab && this.tabCssBtn) {
                    window.Core.UI.setActiveTab(this.tabCssBtn, '.tab-btn');
                }
            }
        }

        renderPalette(hexArray, activeAccentHex, onAccentChange, onCopyHex) {
            if (!this.paletteGrid) return;
            this.paletteGrid.innerHTML = '';
            
            hexArray.forEach(hex => {
                const card = document.createElement('div');
                card.className = `flex-1 min-w-[100px] bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition hover:-translate-y-1 hover:shadow-md ${hex === activeAccentHex ? 'active-accent' : ''}`;
                card.innerHTML = `
                    <div class="h-20 w-full" style="background-color: ${hex};"></div>
                    <div class="p-3 text-center font-mono text-sm font-semibold">
                        <div class="text-gray-800">${hex}</div>
                        <div class="text-xs text-gray-400 mt-1">копировать</div>
                    </div>
                `;
                
                const colorDiv = card.querySelector('.h-20');
                const hexSpan = card.querySelector('.text-gray-800');
                
                // Клик по цвету → смена акцента
                if (colorDiv && typeof onAccentChange === 'function') {
                    colorDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onAccentChange(hex, card);
                    });
                }
                
                // Клик по hex → копирование
                if (hexSpan && typeof onCopyHex === 'function') {
                    hexSpan.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onCopyHex(hex).then(res => {
                            if (!res.ok) console.warn('Copy failed:', res.error);
                        });
                    });
                }
                
                this.paletteGrid.appendChild(card);
            });
        }

        setColors(primary, secondary, accent, text) {
            this.currentPrimary = primary;
            this.currentSecondary = secondary;
            this.currentAccent = accent;
            this.currentText = text;
            this.updateUIAndCode();
        }

        setAccent(accent) {
            this.currentAccent = accent;
            this.updateUIAndCode();
        }

        setPalette(hexArray) {
            this.hexPalette = hexArray;
        }
    };
    
    // Лог для отладки: подтверждаем, что класс экспортирован
    console.log('✅ UIManager загружен и экспортирован в window.UIManager');
})();