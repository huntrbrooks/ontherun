import { GAME_CONFIG } from '../config/gameConfig.js';

export class CollisionManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.quadTree = null;
        this.updateQuadTree();
    }

    updateQuadTree() {
        // Simple spatial partitioning for better performance
        this.quadTree = {
            bounds: {
                x: 0,
                y: 0,
                width: GAME_CONFIG.CANVAS_WIDTH,
                height: GAME_CONFIG.CANVAS_HEIGHT
            },
            objects: []
        };
    }

    checkCollisions() {
        this.checkBuildingCollisions();
        this.checkSupplyCollisions();
        this.checkCashCollisions();
        this.checkPoliceCollisions();
        this.checkDealerCollisions();
    }

    checkBuildingCollisions() {
        const player = this.gameManager.player;
        const buildings = this.gameManager.buildings;
        
        for (const building of buildings) {
            if (this.checkRectCollision(
                player.x - player.size,
                player.y - player.size,
                player.size * 2,
                player.size * 2,
                building.x,
                building.y,
                building.width,
                building.height
            )) {
                // Push player out of building
                const pushX = this.getPushDirection(player.x, building.x, building.x + building.width);
                const pushY = this.getPushDirection(player.y, building.y, building.y + building.height);
                
                if (Math.abs(pushX) < Math.abs(pushY)) {
                    player.x += pushX;
                } else {
                    player.y += pushY;
                }
            }
        }
    }

    checkSupplyCollisions() {
        const player = this.gameManager.player;
        const supplies = this.gameManager.supplies;
        
        for (let i = supplies.length - 1; i >= 0; i--) {
            const supply = supplies[i];
            if (this.getDistance(player, supply) < player.size + supply.size) {
                if (player.money >= supply.cost) {
                    player.money -= supply.cost;
                    player.buzz = Math.min(player.maxBuzz, player.buzz + GAME_CONFIG.SUPPLY.BUZZ_GAIN);
                    supplies.splice(i, 1);
                    this.gameManager.audioManager.playPickupSound();
                    this.gameManager.createSmokeParticles(supply.x, supply.y);
                }
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

    checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    }

    getPushDirection(pos, min, max) {
        if (pos < min) return min - pos;
        if (pos > max) return max - pos;
        return 0;
    }
}
