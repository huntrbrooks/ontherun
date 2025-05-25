import { GAME_CONFIG } from '../config/gameConfig.js';

export class UIManager {
    constructor() {
        this.elements = {};
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        const elementIds = [
            'health', 'money', 'timer', 'gameOver',
            'shop', 'survivalTime', 'finalMoney',
            'supply1', 'supply2', 'supply3'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`UI element not found: ${id}`);
                this.elements[id] = null;
            } else {
                this.elements[id] = element;
            }
        });
    }

    setupEventListeners() {
        // Add event listeners for shop buttons
        ['supply1', 'supply2', 'supply3'].forEach(id => {
            const button = this.elements[id];
            if (button) {
                button.addEventListener('click', () => {
                    const index = parseInt(id.replace('supply', '')) - 1;
                    this.gameManager.buySupply(index);
                });
            }
        });

        // Add escape key listener for shop
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.shop?.style.display === 'block') {
                this.gameManager.closeShop();
            }
        });
    }

    updateUI(player, elapsedSeconds) {
        if (this.elements.health) {
            this.elements.health.textContent = `🔥 Buzz: ${Math.floor(player.buzz)}`;
        }
        if (this.elements.money) {
            this.elements.money.textContent = `💰 Cash: $${Math.floor(player.money)}`;
        }
        if (this.elements.timer && typeof elapsedSeconds === 'number') {
            this.elements.timer.textContent = `⏱️ ${this.formatTime(elapsedSeconds)}`;
        }
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    showGameOver(reason, survivalTime, finalMoney) {
        if (this.elements.gameOver) {
            this.elements.gameOver.style.display = 'block';
            if (this.elements.survivalTime) {
                this.elements.survivalTime.textContent = this.formatTime(survivalTime);
            }
            if (this.elements.finalMoney) {
                this.elements.finalMoney.textContent = `$${Math.floor(finalMoney)}`;
            }
        }
    }

    hideGameOver() {
        if (this.elements.gameOver) {
            this.elements.gameOver.style.display = 'none';
        }
    }

    showShop() {
        if (this.elements.shop) {
            this.elements.shop.style.display = 'block';
            this.updateShopPrices(this.gameManager.purchaseCount);
        }
    }

    hideShop() {
        if (this.elements.shop) {
            this.elements.shop.style.display = 'none';
        }
    }

    updateShopPrices(purchaseCount) {
        const supplies = [
            { id: 'supply1', baseCost: 20, baseBuzz: 50 },
            { id: 'supply2', baseCost: 50, baseBuzz: 100 },
            { id: 'supply3', baseCost: 100, baseBuzz: 200 }
        ];

        supplies.forEach(supply => {
            const button = this.elements[supply.id];
            if (button) {
                const cost = Math.floor(supply.baseCost * (1 + purchaseCount * 0.5));
                const canAfford = this.gameManager.player.money >= cost;
                button.textContent = `Quick Hit - $${cost} (+${supply.baseBuzz} buzz)`;
                button.disabled = !canAfford;
                button.style.opacity = canAfford ? '1' : '0.5';
            }
        });
    }
}
