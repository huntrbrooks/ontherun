import { GAME_CONFIG } from '../config/gameConfig.js';
import { Player } from '../entities/Player.js';
import { Police } from '../entities/Police.js';
import { Supply } from '../entities/Supply.js';
import { Cash } from '../entities/Cash.js';
import { Dealer } from '../entities/Dealer.js';
import { CityGenerator } from '../utils/CityGenerator.js';
import { UIManager } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { CollisionManager } from './CollisionManager.js';

export class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game states
        this.gameState = 'MAIN_MENU'; // MAIN_MENU, PLAYING, PAUSED, GAME_OVER, SHOP
        this.gameRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.purchaseCount = 0;
        this.gameOverReason = "";
        
        // Game progress
        this.score = 0;
        this.level = 1;
        this.highScore = localStorage.getItem('onTheRunHighScore') || 0;
        
        // Initialize managers
        this.uiManager = new UIManager();
        this.audioManager = new AudioManager();
        this.collisionManager = new CollisionManager(this);
        
        // Initialize game objects
        this.player = new Player();
        this.cityGenerator = new CityGenerator();
        
        // Game entities
        this.supplies = [];
        this.cashItems = [];
        this.police = [];
        this.dealers = [];
        this.smokeParticles = [];
        
        // Input handling
        this.keys = {};
        this.nearDealer = false;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        
        this.setupEventListeners();
    }

    async init() {
        // Show main menu initially
        this.showMainMenu();
        
        // Generate city in background
        this.generateCity();
        
        // Start render loop (but not game logic)
        this.renderLoop();
    }

    setupEventListeners() {
        // Menu button listeners
        document.getElementById('newGameButton').addEventListener('click', () => this.startNewGame());
        document.getElementById('loadGameButton').addEventListener('click', () => this.loadGame());
        document.getElementById('settingsButton').addEventListener('click', () => this.showSettings());
        document.getElementById('quitButton').addEventListener('click', () => this.quitGame());
        
        // Pause menu listeners
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('saveGameButton').addEventListener('click', () => this.saveGame());
        document.getElementById('settingsButton2').addEventListener('click', () => this.showSettings());
        document.getElementById('quitToMenuButton').addEventListener('click', () => this.quitToMenu());
        
        // Game over menu listeners
        document.getElementById('restartButton').addEventListener('click', () => this.startNewGame());
        document.getElementById('backToMenuButton').addEventListener('click', () => this.showMainMenu());
        
        // Shop listeners
        document.getElementById('supply1').addEventListener('click', () => this.buySupply(0));
        document.getElementById('supply2').addEventListener('click', () => this.buySupply(1));
        document.getElementById('supply3').addEventListener('click', () => this.buySupply(2));
        document.getElementById('leaveShopButton').addEventListener('click', () => this.closeShop());
        
        // Settings listeners
        document.getElementById('saveSettingsButton').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelSettingsButton').addEventListener('click', () => this.hideSettings());
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.updateVolumeDisplay(e));
        
        // Keyboard listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        // ESC key handling
        if (e.key === 'Escape') {
            if (this.gameState === 'PLAYING') {
                this.pauseGame();
            } else if (this.gameState === 'PAUSED') {
                this.resumeGame();
            } else if (this.gameState === 'SHOP') {
                this.closeShop();
            } else if (this.gameState === 'SETTINGS') {
                this.hideSettings();
            }
        }
        
        // Spacebar for shop
        if (e.key === ' ' && this.gameState === 'PLAYING' && this.nearDealer) {
            this.openShop();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }

    // Menu state management
    showMainMenu() {
        this.gameState = 'MAIN_MENU';
        this.gameRunning = false;
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('shop').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'none';
        document.getElementById('ui').style.display = 'none';
        document.getElementById('instructions').style.display = 'none';
    }

    startNewGame() {
        this.gameState = 'PLAYING';
        this.gameRunning = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.purchaseCount = 0;
        this.score = 0;
        this.level = 1;
        
        // Reset player
        this.player.reset();
        
        // Reset game entities
        this.supplies = [];
        this.cashItems = [];
        this.police = [];
        this.smokeParticles = [];
        
        // Generate new city and spawn entities
        this.generateCity();
        
        // Hide all menus and show game UI
        this.hideAllMenus();
        document.getElementById('ui').style.display = 'flex';
        document.getElementById('instructions').style.display = 'block';
        
        // Start game loop
        this.gameLoop();
    }

    pauseGame() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.gameRunning = false;
            document.getElementById('pauseMenu').style.display = 'flex';
        }
    }

    resumeGame() {
        if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.gameRunning = true;
            document.getElementById('pauseMenu').style.display = 'none';
            this.gameLoop();
        }
    }

    quitToMenu() {
        this.showMainMenu();
    }

    quitGame() {
        if (confirm('Are you sure you want to quit?')) {
            window.close();
        }
    }

    showSettings() {
        const previousState = this.gameState;
        this.gameState = 'SETTINGS';
        this.hideAllMenus();
        document.getElementById('settingsMenu').style.display = 'flex';
        
        // Store previous state for return
        this.previousGameState = previousState;
    }

    hideSettings() {
        this.gameState = this.previousGameState || 'MAIN_MENU';
        document.getElementById('settingsMenu').style.display = 'none';
        
        if (this.gameState === 'MAIN_MENU') {
            document.getElementById('mainMenu').style.display = 'flex';
        } else if (this.gameState === 'PAUSED') {
            document.getElementById('pauseMenu').style.display = 'flex';
        }
    }

    saveSettings() {
        const volume = document.getElementById('volumeSlider').value;
        const difficulty = document.getElementById('difficultySelect').value;
        
        localStorage.setItem('gameVolume', volume);
        localStorage.setItem('gameDifficulty', difficulty);
        
        // Apply settings
        this.audioManager.setVolume(volume / 100);
        
        this.hideSettings();
    }

    updateVolumeDisplay(e) {
        document.getElementById('volumeValue').textContent = e.target.value + '%';
    }

    loadGame() {
        const savedGame = localStorage.getItem('onTheRunSaveGame');
        if (savedGame) {
            const gameData = JSON.parse(savedGame);
            // Implement load game logic here
            alert('Game loaded!'); // Placeholder
            this.startNewGame(); // For now, just start new game
        } else {
            alert('No saved game found!');
        }
    }

    saveGame() {
        const gameData = {
            player: {
                x: this.player.x,
                y: this.player.y,
                buzz: this.player.buzz,
                money: this.player.money
            },
            elapsedTime: this.elapsedTime,
            purchaseCount: this.purchaseCount,
            score: this.score,
            level: this.level
        };
        
        localStorage.setItem('onTheRunSaveGame', JSON.stringify(gameData));
        alert('Game saved!');
    }

    hideAllMenus() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('shop').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'none';
    }

    // Shop management
    openShop() {
        if (this.gameState === 'PLAYING' && this.nearDealer) {
            this.gameState = 'SHOP';
            this.gameRunning = false;
            document.getElementById('shop').style.display = 'flex';
            this.uiManager.updateShopPrices(this.purchaseCount);
            this.audioManager.playShopSound();
        }
    }

    closeShop() {
        if (this.gameState === 'SHOP') {
            this.gameState = 'PLAYING';
            this.gameRunning = true;
            document.getElementById('shop').style.display = 'none';
            this.gameLoop();
        }
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
            
            // Update UI immediately
            this.uiManager.updateUI(this.player, this.elapsedTime);
        } else {
            alert('Not enough cash!');
        }
    }

    // Game generation and setup
    generateCity() {
        const city = this.cityGenerator.generate();
        this.buildings = city.buildings;
        this.streets = city.streets;
        this.spawnDealers();
        this.spawnSupplies();
        this.spawnCash();
    }

    spawnDealers() {
        this.dealers = [];
        GAME_CONFIG.DEALER.POSITIONS.forEach(pos => {
            this.dealers.push(new Dealer(pos.x, pos.y));
        });
    }

    spawnSupplies() {
        this.supplies = [];
        for (let i = 0; i < GAME_CONFIG.SUPPLY.COUNT; i++) {
            let attempts = 0;
            let x, y;
            
            do {
                x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20;
                attempts++;
            } while (!this.isValidPosition(x, y, GAME_CONFIG.SUPPLY.SIZE) && attempts < 100);
            
            if (attempts < 100) {
                this.supplies.push(new Supply(x, y));
            }
        }
    }

    spawnCash() {
        this.cashItems = [];
        for (let i = 0; i < GAME_CONFIG.CASH.COUNT; i++) {
            let attempts = 0;
            let x, y;
            
            do {
                x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20;
                attempts++;
            } while (!this.isValidPosition(x, y, GAME_CONFIG.CASH.SIZE) && attempts < 100);
            
            if (attempts < 100) {
                this.cashItems.push(new Cash(x, y));
            }
        }
    }

    spawnPolice() {
        if (this.player.money < GAME_CONFIG.POLICE.MONEY_THRESHOLD) {
            this.police = [];
            return;
        }
        
        const targetPoliceCount = Math.min(
            Math.floor((this.player.money - GAME_CONFIG.POLICE.MONEY_THRESHOLD) / 500) + 1,
            8
        );
        
        while (this.police.length < targetPoliceCount) {
            let attempts = 0;
            let x, y;
            
            do {
                x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20;
                attempts++;
            } while (!this.isValidPosition(x, y, GAME_CONFIG.POLICE.SIZE) && attempts < 100);
            
            if (attempts < 100) {
                this.police.push(new Police(x, y));
            }
        }
    }

    isValidPosition(x, y, size) {
        if (x - size < 0 || x + size > GAME_CONFIG.CANVAS_WIDTH ||
            y - size < 0 || y + size > GAME_CONFIG.CANVAS_HEIGHT) {
            return false;
        }

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

    // Game loop and updates
    update() {
        if (!this.gameRunning || this.gameState !== 'PLAYING') return;
        
        const currentTime = performance.now();
        this.elapsedTime = (currentTime - this.startTime) / 1000;
        
        // Update player
        this.player.update(this.buildings, this.keys);
        
        // Check if near dealer
        this.checkNearDealer();
        
        // Update entities
        this.supplies.forEach(supply => supply.update());
        this.cashItems.forEach(cash => cash.update());
        this.police.forEach(cop => cop.update(this.player.x, this.player.y, this.buildings));
        
        // Spawn police based on money
        this.spawnPolice();
        
        // Check collisions
        this.collisionManager.checkCollisions();
        
        // Respawn items
        this.respawnSuppliesAndCash();
        
        // Check game over conditions
        if (this.player.updateBuzz(this.purchaseCount)) {
            this.gameOverReason = "WITHDRAWAL";
            this.gameOver();
        }
        
        // Update UI
        this.uiManager.updateUI(this.player, this.elapsedTime);
    }

    checkNearDealer() {
        this.nearDealer = false;
        for (const dealer of this.dealers) {
            const distance = Math.sqrt(
                Math.pow(this.player.x - dealer.x, 2) + 
                Math.pow(this.player.y - dealer.y, 2)
            );
            if (distance < this.player.size + dealer.size + 10) {
                this.nearDealer = true;
                break;
            }
        }
    }

    render() {
        // Clear canvas
        const gradient = this.ctx.createLinearGradient(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, GAME_CONFIG.COLORS.BACKGROUND[0]);
        gradient.addColorStop(1, GAME_CONFIG.COLORS.BACKGROUND[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // Draw city
        this.cityGenerator.draw(this.ctx);

        // Draw game objects
        this.dealers.forEach(dealer => dealer.draw(this.ctx));
        this.supplies.forEach(supply => supply.draw(this.ctx));
        this.cashItems.forEach(cash => cash.draw(this.ctx));
        this.police.forEach(cop => cop.draw(this.ctx));
        this.drawSmokeParticles();
        
        // Draw player
        if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED' || this.gameState === 'SHOP') {
            this.player.draw(this.ctx);
        }
        
        // Draw "Press SPACE to shop" hint
        if (this.nearDealer && this.gameState === 'PLAYING') {
            this.ctx.fillStyle = '#ffa500';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE to shop', GAME_CONFIG.CANVAS_WIDTH / 2, 50);
        }
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
            particle.vy -= 0.1;

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

    renderLoop() {
        this.render();
        requestAnimationFrame(() => this.renderLoop());
    }

    gameOver() {
        this.gameRunning = false;
        this.gameState = 'GAME_OVER';
        const survivalTime = Math.floor(this.elapsedTime);
        this.score = Math.floor(this.player.money + (survivalTime * 10));
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('onTheRunHighScore', this.highScore.toString());
        }
        
        this.uiManager.showGameOver(this.gameOverReason, survivalTime, this.score);
        this.audioManager.playGameOverSound();
        document.getElementById('gameOver').style.display = 'flex';
    }

    respawnSuppliesAndCash() {
        // Respawn supplies
        while (this.supplies.length < GAME_CONFIG.SUPPLY.COUNT) {
            let attempts = 0;
            let x, y;
            do {
                x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20;
                attempts++;
            } while (!this.isValidPosition(x, y, GAME_CONFIG.SUPPLY.SIZE) && attempts < 100);
            
            if (attempts < 100) {
                this.supplies.push(new Supply(x, y));
            }
        }
        
        // Respawn cash
        while (this.cashItems.length < GAME_CONFIG.CASH.COUNT) {
            let attempts = 0;
            let x, y;
            do {
                x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20;
                attempts++;
            } while (!this.isValidPosition(x, y, GAME_CONFIG.CASH.SIZE) && attempts < 100);
            
            if (attempts < 100) {
                this.cashItems.push(new Cash(x, y));
            }
        }
    }
}