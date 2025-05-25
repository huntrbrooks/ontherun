import { GAME_CONFIG } from '../config/gameConfig.js';
import { Player } from '../entities/Player.js';
import { CityGenerator } from '../utils/CityGenerator.js';
import { UIManager } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { CollisionManager } from './CollisionManager.js';

export class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.purchaseCount = 0;
        this.shopOpen = false;
        this.gameOverReason = "";
        
        // Initialize managers
        this.uiManager = new UIManager();
        this.audioManager = new AudioManager();
        this.collisionManager = new CollisionManager(this);
        
        // Initialize game objects
        this.player = new Player();
        this.cityGenerator = new CityGenerator();
        
        // Game state
        this.supplies = [];
        this.cashItems = [];
        this.police = [];
        this.dealers = [];
        this.smokeParticles = [];
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);

        document.addEventListener('keydown', (e) => {
            if (this.shopOpen && (e.key === 'Escape' || e.key === 'Esc')) {
                this.closeShop();
            }
        });
    }

    async init() {
        this.gameRunning = true;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.generateCity();
        this.gameLoop();
    }

    generateCity() {
        const city = this.cityGenerator.generate();
        this.buildings = city.buildings;
        this.streets = city.streets;
        this.spawnDealers();
        this.spawnSupplies();
    }

    spawnDealers() {
        this.dealers = GAME_CONFIG.DEALER.POSITIONS.map(pos => ({
            x: pos.x,
            y: pos.y,
            size: GAME_CONFIG.DEALER.SIZE
        }));
    }

    spawnSupplies() {
        // Spawn ice crystals
        while (this.supplies.length < GAME_CONFIG.SUPPLY.COUNT) {
            let attempts = 0;
            let supply;
            
            do {
                supply = {
                    x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                    y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                    size: GAME_CONFIG.SUPPLY.SIZE,
                    cost: GAME_CONFIG.SUPPLY.MIN_COST + Math.random() * (GAME_CONFIG.SUPPLY.MAX_COST - GAME_CONFIG.SUPPLY.MIN_COST),
                    glow: Math.random() * Math.PI * 2
                };
                attempts++;
            } while (!this.isValidPosition(supply.x, supply.y, supply.size) && attempts < 100);
            
            if (attempts < 100) {
                this.supplies.push(supply);
            }
        }
        
        // Spawn cash items
        while (this.cashItems.length < GAME_CONFIG.CASH.COUNT) {
            let attempts = 0;
            let cash;
            
            do {
                cash = {
                    x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                    y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                    size: GAME_CONFIG.CASH.SIZE,
                    value: GAME_CONFIG.CASH.MIN_VALUE + Math.random() * (GAME_CONFIG.CASH.MAX_VALUE - GAME_CONFIG.CASH.MIN_VALUE),
                    glow: Math.random() * Math.PI * 2
                };
                attempts++;
            } while (!this.isValidPosition(cash.x, cash.y, cash.size) && attempts < 100);
            
            if (attempts < 100) {
                this.cashItems.push(cash);
            }
        }
    }

    spawnPolice() {
        if (this.player.money < GAME_CONFIG.POLICE.MONEY_THRESHOLD) {
            this.police = [];
            return;
        }
        
        const targetPoliceCount = Math.floor((this.player.money - GAME_CONFIG.POLICE.MONEY_THRESHOLD) / 500) + 1;
        
        while (this.police.length < targetPoliceCount && this.police.length < 8) {
            let attempts = 0;
            let cop;
            
            do {
                cop = {
                    x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                    y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                    size: GAME_CONFIG.POLICE.SIZE,
                    speed: GAME_CONFIG.POLICE.MIN_SPEED + Math.random() * (GAME_CONFIG.POLICE.MAX_SPEED - GAME_CONFIG.POLICE.MIN_SPEED),
                    targetX: this.player.x,
                    targetY: this.player.y,
                    alertRadius: GAME_CONFIG.POLICE.ALERT_RADIUS
                };
                attempts++;
            } while (!this.isValidPosition(cop.x, cop.y, cop.size) && attempts < 100);
            
            if (attempts < 100) {
                this.police.push(cop);
            }
        }
    }

    isValidPosition(x, y, size) {
        // Check if position is not inside buildings
        for (let building of this.buildings) {
            if (x - size < building.x + building.width &&
                x + size > building.x &&
                y - size < building.y + building.height &&
                y + size > building.y) {
                return false;
            }
        }
        return true;
    }

    update() {
        if (!this.gameRunning || this.shopOpen) return;
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        this.player.update(this.buildings);
        this.updatePolice();
        this.checkCollisions();
        this.respawnSuppliesAndCash();
        if (this.player.updateBuzz(this.purchaseCount)) {
            this.gameOverReason = "WITHDRAWAL";
            this.gameOver();
        }
        this.uiManager.updateUI(this.player, this.elapsedTime);
    }

    updatePolice() {
        this.police.forEach(cop => {
            const distToPlayer = Math.sqrt(
                Math.pow(this.player.x - cop.x, 2) + Math.pow(this.player.y - cop.y, 2)
            );
            
            if (distToPlayer < cop.alertRadius) {
                const angle = Math.atan2(this.player.y - cop.y, this.player.x - cop.x);
                const newX = cop.x + Math.cos(angle) * cop.speed;
                const newY = cop.y + Math.sin(angle) * cop.speed;
                
                if (this.isValidPosition(newX, newY, cop.size)) {
                    cop.x = newX;
                    cop.y = newY;
                }
            } else {
                // Random patrol movement
                cop.x += (Math.random() - 0.5) * 2;
                cop.y += (Math.random() - 0.5) * 2;
                
                // Keep within bounds
                cop.x = Math.max(cop.size, Math.min(GAME_CONFIG.CANVAS_WIDTH - cop.size, cop.x));
                cop.y = Math.max(cop.size, Math.min(GAME_CONFIG.CANVAS_HEIGHT - cop.size, cop.y));
            }
        });
    }

    checkCollisions() {
        this.collisionManager.checkCollisions();
    }

    render() {
        // Clear canvas with city background
        const gradient = this.ctx.createLinearGradient(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, GAME_CONFIG.COLORS.BACKGROUND[0]);
        gradient.addColorStop(1, GAME_CONFIG.COLORS.BACKGROUND[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // Draw city
        this.cityGenerator.draw(this.ctx);

        // Draw game objects
        this.drawDealers();
        this.drawSupplies();
        this.drawCashItems();
        this.drawPolice();
        this.drawSmokeParticles();
        this.player.draw(this.ctx);
    }

    drawDealers() {
        this.dealers.forEach(dealer => {
            // Dealer glow
            const glowGradient = this.ctx.createRadialGradient(
                dealer.x, dealer.y, 0,
                dealer.x, dealer.y, dealer.size
            );
            glowGradient.addColorStop(0, 'rgba(255, 165, 0, 0.6)');
            glowGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(dealer.x - dealer.size, dealer.y - dealer.size, dealer.size * 2, dealer.size * 2);

            // Motorcycle body
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(dealer.x - 12, dealer.y - 4, 24, 8);

            // Motorcycle wheels
            this.ctx.fillStyle = '#444';
            this.ctx.beginPath();
            this.ctx.arc(dealer.x - 8, dealer.y + 2, 6, 0, Math.PI * 2);
            this.ctx.arc(dealer.x + 8, dealer.y + 2, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Wheel spokes
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(dealer.x - 8, dealer.y + 2);
                this.ctx.lineTo(dealer.x - 8 + Math.cos(angle) * 4, dealer.y + 2 + Math.sin(angle) * 4);
                this.ctx.moveTo(dealer.x + 8, dealer.y + 2);
                this.ctx.lineTo(dealer.x + 8 + Math.cos(angle) * 4, dealer.y + 2 + Math.sin(angle) * 4);
                this.ctx.stroke();
            }

            // Handlebars
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(dealer.x - 10, dealer.y - 8, 20, 3);

            // Exhaust pipes
            this.ctx.fillStyle = '#888';
            this.ctx.fillRect(dealer.x + 6, dealer.y - 2, 8, 2);

            // Headlight
            this.ctx.fillStyle = '#ffeb3b';
            this.ctx.beginPath();
            this.ctx.arc(dealer.x - 10, dealer.y - 2, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawSupplies() {
        this.supplies.forEach(supply => {
            // Supply glow
            const glowGradient = this.ctx.createRadialGradient(
                supply.x, supply.y, 0,
                supply.x, supply.y, supply.size * 2
            );
            glowGradient.addColorStop(0, 'rgba(173, 216, 230, 0.6)');
            glowGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(supply.x - supply.size * 2, supply.y - supply.size * 2, supply.size * 4, supply.size * 4);

            // Supply crystal
            this.ctx.fillStyle = GAME_CONFIG.COLORS.SUPPLY.BASE;
            this.ctx.beginPath();
            this.ctx.moveTo(supply.x, supply.y - supply.size);
            this.ctx.lineTo(supply.x + supply.size, supply.y);
            this.ctx.lineTo(supply.x, supply.y + supply.size);
            this.ctx.lineTo(supply.x - supply.size, supply.y);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    drawCashItems() {
        this.cashItems.forEach(cash => {
            // Cash glow
            const glowGradient = this.ctx.createRadialGradient(
                cash.x, cash.y, 0,
                cash.x, cash.y, cash.size * 2
            );
            glowGradient.addColorStop(0, 'rgba(46, 213, 115, 0.6)');
            glowGradient.addColorStop(1, 'rgba(46, 213, 115, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(cash.x - cash.size * 2, cash.y - cash.size * 2, cash.size * 4, cash.size * 4);

            // Cash symbol
            this.ctx.fillStyle = GAME_CONFIG.COLORS.CASH.BASE;
            this.ctx.font = `${cash.size * 1.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('$', cash.x, cash.y);
        });
    }

    drawPolice() {
        this.police.forEach(cop => {
            // Police glow
            const glowGradient = this.ctx.createRadialGradient(
                cop.x, cop.y, 0,
                cop.x, cop.y, cop.size
            );
            glowGradient.addColorStop(0, 'rgba(0, 102, 204, 0.6)');
            glowGradient.addColorStop(1, 'rgba(0, 102, 204, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(cop.x - cop.size, cop.y - cop.size, cop.size * 2, cop.size * 2);

            // Police body
            this.ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.BODY;
            this.ctx.beginPath();
            this.ctx.arc(cop.x, cop.y, cop.size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();

            // Police hat
            this.ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.HAT;
            this.ctx.beginPath();
            this.ctx.arc(cop.x, cop.y - cop.size * 0.4, cop.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();

            // Police badge
            this.ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.BADGE;
            this.ctx.beginPath();
            this.ctx.arc(cop.x, cop.y + cop.size * 0.2, cop.size * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawSmokeParticles() {
        this.smokeParticles.forEach((particle, index) => {
            particle.life -= 0.02;
            if (particle.life <= 0) {
                this.smokeParticles.splice(index, 1);
                return;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy -= 0.1; // Float upward

            this.ctx.fillStyle = `rgba(200, 200, 200, ${particle.life})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    createSmokeParticles(x, y) {
        for (let i = 0; i < GAME_CONFIG.MECHANICS.SMOKE_PARTICLES; i++) {
            this.smokeParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2,
                size: Math.random() * 4 + 2,
                life: 1
            });
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.render();
        requestAnimationFrame(this.gameLoop);
    }

    gameOver() {
        this.gameRunning = false;
        const survivalTime = Math.floor(this.elapsedTime);
        this.uiManager.showGameOver(this.gameOverReason, survivalTime, this.player.money);
        this.audioManager.playGameOverSound();
    }

    restartGame() {
        this.player.reset();
        this.purchaseCount = 0;
        this.supplies = [];
        this.cashItems = [];
        this.police = [];
        this.smokeParticles = [];
        this.uiManager.hideGameOver();
        this.generateCity();
        this.gameRunning = true;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.gameLoop();
    }

    openShop() {
        this.shopOpen = true;
        this.uiManager.showShop();
        this.uiManager.updateShopPrices(this.purchaseCount);
        this.audioManager.playShopSound();
    }

    closeShop() {
        this.shopOpen = false;
        this.uiManager.hideShop();
        this.gameLoop();
    }

    buySupply(index) {
        const supply = GAME_CONFIG.SHOP.SUPPLIES[index];
        const cost = Math.floor(supply.cost * (1 + this.purchaseCount * GAME_CONFIG.SHOP.PRICE_MULTIPLIER));
        
        if (this.player.money >= cost) {
            this.player.money -= cost;
            this.player.buzz = Math.min(this.player.maxBuzz, this.player.buzz + supply.buzzGain);
            this.purchaseCount++;
            this.uiManager.updateShopPrices(this.purchaseCount);
            this.audioManager.playExhaleSound();
        }
    }

    respawnSuppliesAndCash() {
        // Respawn supplies if below count
        while (this.supplies.length < GAME_CONFIG.SUPPLY.COUNT) {
            let attempts = 0;
            let supply;
            do {
                supply = {
                    x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                    y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                    size: GAME_CONFIG.SUPPLY.SIZE,
                    cost: GAME_CONFIG.SUPPLY.MIN_COST + Math.random() * (GAME_CONFIG.SUPPLY.MAX_COST - GAME_CONFIG.SUPPLY.MIN_COST),
                    glow: Math.random() * Math.PI * 2
                };
                attempts++;
            } while (!this.isValidPosition(supply.x, supply.y, supply.size) && attempts < 100);
            if (attempts < 100) {
                this.supplies.push(supply);
            }
        }
        // Respawn cash if below count
        while (this.cashItems.length < GAME_CONFIG.CASH.COUNT) {
            let attempts = 0;
            let cash;
            do {
                cash = {
                    x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                    y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                    size: GAME_CONFIG.CASH.SIZE,
                    value: GAME_CONFIG.CASH.MIN_VALUE + Math.random() * (GAME_CONFIG.CASH.MAX_VALUE - GAME_CONFIG.CASH.MIN_VALUE),
                    glow: Math.random() * Math.PI * 2
                };
                attempts++;
            } while (!this.isValidPosition(cash.x, cash.y, cash.size) && attempts < 100);
            if (attempts < 100) {
                this.cashItems.push(cash);
            }
        }
    }
}
