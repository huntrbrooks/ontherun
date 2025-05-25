import { GAME_CONFIG } from '../config/gameConfig.js';

export class CollisionManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
    }

    checkCollisions() {
        this.checkSupplyCollisions();
        this.checkCashCollisions();
        this.checkPoliceCollisions();
        this.checkDealerCollisions();
    }

    checkSupplyCollisions() {
        const player = this.gameManager.player;
        const supplies = this.gameManager.supplies;
        
        for (let i = supplies.length - 1; i >= 0; i--) {
            const supply = supplies[i];
            if (this.getDistance(player, supply) < player.size + supply.size) {
                player.money -= supply.cost;
                player.buzz = Math.min(player.maxBuzz, player.buzz + GAME_CONFIG.SUPPLY.BUZZ_GAIN);
                supplies.splice(i, 1);
                this.gameManager.audioManager.playPickupSound();
                this.gameManager.createSmokeParticles(supply.x, supply.y);
            }
        }
    }

    checkCashCollisions() {
        const player = this.gameManager.player;
        const cashItems = this.gameManager.cashItems;
        
        for (let i = cashItems.length - 1; i >= 0; i--) {
            const cash = cashItems[i];
            if (this.getDistance(player, cash) < player.size + cash.size) {
                player.money += cash.value;
                cashItems.splice(i, 1);
                this.gameManager.audioManager.playPickupSound();
            }
        }
    }

    checkPoliceCollisions() {
        const player = this.gameManager.player;
        const police = this.gameManager.police;
        
        for (const cop of police) {
            if (this.getDistance(player, cop) < player.size + cop.size) {
                this.gameManager.gameOverReason = "BUSTED";
                this.gameManager.gameOver();
                return;
            }
        }
    }

    checkDealerCollisions() {
        const player = this.gameManager.player;
        const dealers = this.gameManager.dealers;
        
        for (const dealer of dealers) {
            if (this.getDistance(player, dealer) < player.size + dealer.size) {
                if (player.money < 0) {
                    this.gameManager.gameOverReason = "DEALER_KILLED";
                    this.gameManager.gameOver();
                } else {
                    this.gameManager.openShop();
                }
                return;
            }
        }
    }

    getDistance(obj1, obj2) {
        return Math.sqrt(
            Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)
        );
    }
}
