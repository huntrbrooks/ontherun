import { GAME_CONFIG } from '../config/gameConfig.js';

export class UIManager {
    constructor() {
        this.healthElement = document.getElementById('health');
        this.moneyElement = document.getElementById('money');
        this.timerElement = document.getElementById('timer');
        this.survivalTimeElement = document.getElementById('survivalTime');
        this.finalMoneyElement = document.getElementById('finalMoney');
    }

    updateUI(player, elapsedSeconds) {
        if (this.healthElement) {
            // Change color based on buzz level
            const buzzPercentage = player.buzz / player.maxBuzz;
            let buzzColor = '#2ed573'; // Green
            if (buzzPercentage < 0.3) {
                buzzColor = '#ff4757'; // Red
            } else if (buzzPercentage < 0.6) {
                buzzColor = '#ffa500'; // Orange
            }
            
            this.healthElement.innerHTML = `🔥 <span style="color: ${buzzColor}">Buzz: ${Math.floor(player.buzz)}</span>`;
        }
        
        if (this.moneyElement) {
            // Change color based on money amount
            let moneyColor = '#2ed573'; // Green
            if (player.money < 0) {
                moneyColor = '#ff4757'; // Red
            } else if (player.money > 1000) {
                moneyColor = '#ffa500'; // Orange (police warning)
            }
            
            this.moneyElement.innerHTML = `💰 <span style="color: ${moneyColor}">Cash: $${Math.floor(player.money)}</span>`;
        }
        
        if (this.timerElement && typeof elapsedSeconds === 'number') {
            this.timerElement.textContent = `⏱️ ${this.formatTime(elapsedSeconds)}`;
        }
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    showGameOver(reason, survivalTime, finalScore) {
        if (this.survivalTimeElement) {
            this.survivalTimeElement.textContent = survivalTime;
        }
        if (this.finalMoneyElement) {
            this.finalMoneyElement.textContent = Math.floor(finalScore);
        }
        
        // Update game over message based on reason
        const gameOverElement = document.getElementById('gameOver');
        const gameOverTitle = gameOverElement.querySelector('h2');
        const gameOverMessage = gameOverElement.querySelector('p');
        
        switch(reason) {
            case 'BUSTED':
                gameOverTitle.textContent = '🚨 BUSTED! 🚨';
                gameOverMessage.textContent = 'The cops finally caught up...';
                break;
            case 'DEALER_KILLED':
                gameOverTitle.textContent = '💀 DEALER REVENGE 💀';
                gameOverMessage.textContent = 'Never mess with street dealers...';
                break;
            case 'WITHDRAWAL':
                gameOverTitle.textContent = '💀 FLATLINED 💀';
                gameOverMessage.textContent = 'The withdrawal finally caught up...';
                break;
            default:
                gameOverTitle.textContent = '💀 GAME OVER 💀';
                gameOverMessage.textContent = 'The streets claimed another soul...';
        }
    }

    updateShopPrices(purchaseCount) {
        const supplies = [
            { id: 'supply1', baseCost: 20, baseBuzz: 50, name: 'Quick Hit' },
            { id: 'supply2', baseCost: 50, baseBuzz: 100, name: 'Double Dose' },
            { id: 'supply3', baseCost: 100, baseBuzz: 200, name: 'Pure Grade' }
        ];

        supplies.forEach(supply => {
            const cost = Math.floor(supply.baseCost * (1 + purchaseCount * GAME_CONFIG.SHOP.PRICE_MULTIPLIER));
            const button = document.getElementById(supply.id);
            if (button) {
                button.innerHTML = `${supply.name} - <span style="color: #ff6b7a">$${cost}</span> <span style="color: #2ed573">(+${supply.baseBuzz} buzz)</span>`;
                
                // Disable button if player can't afford it
                // This will be handled by the GameManager when it calls this method
            }
        });
    }

    // Helper methods for showing/hiding UI elements
    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'flex';
        }
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    // Update shop button availability based on player money
    updateShopButtonAvailability(playerMoney, purchaseCount) {
        const supplies = GAME_CONFIG.SHOP.SUPPLIES;
        
        supplies.forEach((supply, index) => {
            const cost = Math.floor(supply.cost * (1 + purchaseCount * GAME_CONFIG.SHOP.PRICE_MULTIPLIER));
            const button = document.getElementById(`supply${index + 1}`);
            
            if (button) {
                if (playerMoney >= cost) {
                    button.disabled = false;
                    button.style.opacity = '1';
                } else {
                    button.disabled = true;
                    button.style.opacity = '0.5';
                }
            }
        });
    }

    // Show tutorial or help text
    showTutorial() {
        // Could be expanded to show interactive tutorial
        alert(`🏃‍♂️ ON THE RUN - Tutorial
        
        CONTROLS:
        • WASD or Arrow Keys to move
        • SPACEBAR near dealers to shop
        • ESC to pause
        
        OBJECTIVE:
        • Collect cash 💵 to earn money
        • Buy supplies ❄ to maintain your buzz
        • Avoid police 👮‍♂️ who chase you when you have too much money
        
        WARNING:
        • Your buzz decreases over time - don't let it hit zero!
        • Negative money = dealers will kill you
        • High money = police will spawn and chase you!
        
        Good luck surviving the streets!`);
    }
}