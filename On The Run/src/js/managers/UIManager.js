import { GAME_CONFIG } from '../config/gameConfig.js';

export class UIManager {
    constructor() {
        this.healthElement = document.getElementById('health');
        this.moneyElement = document.getElementById('money');
        this.timerElement = document.getElementById('timer');
        this.gameOverElement = document.getElementById('gameOver');
        this.shopElement = document.getElementById('shop');
        this.survivalTimeElement = document.getElementById('survivalTime');
        this.finalMoneyElement = document.getElementById('finalMoney');
    }

    updateUI(player, elapsedSeconds) {
        this.healthElement.textContent = `🔥 Buzz: ${Math.floor(player.buzz)}`;
        this.moneyElement.textContent = `💰 Cash: $${Math.floor(player.money)}`;
        if (typeof elapsedSeconds === 'number') {
            this.timerElement.textContent = `⏱️ ${this.formatTime(elapsedSeconds)}`;
        }
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    showGameOver(reason, survivalTime, finalMoney) {
        this.gameOverElement.style.display = 'block';
        this.survivalTimeElement.textContent = survivalTime;
        this.finalMoneyElement.textContent = Math.floor(finalMoney);
    }

    hideGameOver() {
        this.gameOverElement.style.display = 'none';
    }

    showShop() {
        this.shopElement.style.display = 'block';
    }

    hideShop() {
        this.shopElement.style.display = 'none';
    }

    updateShopPrices(purchaseCount) {
        const supplies = [
            { id: 'supply1', baseCost: 20, baseBuzz: 50 },
            { id: 'supply2', baseCost: 50, baseBuzz: 100 },
            { id: 'supply3', baseCost: 100, baseBuzz: 200 }
        ];

        supplies.forEach(supply => {
            const cost = Math.floor(supply.baseCost * (1 + purchaseCount * 0.5));
            const button = document.getElementById(supply.id);
            button.textContent = `Quick Hit - $${cost} (+${supply.baseBuzz} buzz)`;
        });
    }
}
