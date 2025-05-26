import { GAME_CONFIG } from '../config/gameConfig.js';
import { GameState } from './GameState.js';

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
            'supply1', 'supply2', 'supply3',
            'mainMenu', 'pauseMenu', 'continueButton',
            'newGameButton', 'loadGameButton', 'quitButton',
            'saveButton', 'quitToMenuButton'
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
        // Shop buttons
        ['supply1', 'supply2', 'supply3'].forEach(id => {
            const button = this.elements[id];
            if (button) {
                button.addEventListener('click', () => {
                    const index = parseInt(id.replace('supply', '')) - 1;
                    window.gameManager.buySupply(index);
                });
            }
        });

        // Main menu buttons
        if (this.elements.newGameButton) {
            this.elements.newGameButton.addEventListener('click', () => {
                this.hideAllMenus();
                window.gameManager.startGame();
            });
        }

        if (this.elements.loadGameButton) {
            this.elements.loadGameButton.addEventListener('click', () => {
                this.hideAllMenus();
                window.gameManager.loadGame();
                window.gameManager.startGame();
            });
        }

        if (this.elements.continueButton) {
            this.elements.continueButton.addEventListener('click', () => {
                this.hideAllMenus();
                window.gameManager.resumeGame();
            });
        }

        if (this.elements.quitButton) {
            this.elements.quitButton.addEventListener('click', () => {
                window.close();
            });
        }

        if (this.elements.saveButton) {
            this.elements.saveButton.addEventListener('click', () => {
                window.gameManager.saveGame();
            });
        }

        if (this.elements.quitToMenuButton) {
            this.elements.quitToMenuButton.addEventListener('click', () => {
                this.hideAllMenus();
                this.showMainMenu();
            });
        }
    }

    showMainMenu() {
        this.hideAllMenus();
        if (this.elements.mainMenu) {
            this.elements.mainMenu.style.display = 'block';
        }
    }

    showPauseMenu() {
        this.hideAllMenus();
        if (this.elements.pauseMenu) {
            this.elements.pauseMenu.style.display = 'block';
        }
    }

    hideAllMenus() {
        ['mainMenu', 'pauseMenu', 'shop', 'gameOver'].forEach(menuId => {
            if (this.elements[menuId]) {
                this.elements[menuId].style.display = 'none';
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
        this.hideAllMenus();
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
        this.hideAllMenus();
        if (this.elements.shop) {
            this.elements.shop.style.display = 'block';
            this.updateShopPrices(window.gameManager.purchaseCount);
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
                const canAfford = window.gameManager.player.money >= cost;
                button.textContent = `Quick Hit - $${cost} (+${supply.baseBuzz} buzz)`;
                button.disabled = !canAfford;
                button.style.opacity = canAfford ? '1' : '0.5';
            }
        });
    }
}
