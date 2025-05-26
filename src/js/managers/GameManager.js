import { GAME_CONFIG } from '../config/gameConfig.js';
import { Player } from '../entities/Player.js';
import { CityGenerator } from '../utils/CityGenerator.js';
import { SpriteManager } from '../managers/SpriteManager.js';
import { UIManager } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { CollisionManager } from './CollisionManager.js';
import { GameState } from './GameState.js';

export class GameManager {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state management
        this.gameState = new GameState();
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastFrameTime = 0;
        this.purchaseCount = 0;
        this.gameOverReason = "";
        
        // Initialize managers
        this.spriteManager = new SpriteManager();
        this.uiManager = new UIManager();
        this.audioManager = new AudioManager();
        this.collisionManager = new CollisionManager(this);
        
        // Initialize game objects (pass spriteManager to player)
        this.player = new Player(this.spriteManager);
        this.cityGenerator = new CityGenerator();
        
        // Game state arrays
        this.supplies = [];
        this.cashItems = [];
        this.police = [];
        this.dealers = [];
        this.smokeParticles = [];
        
        // Track current dealer interaction
        this.currentDealerIndex = null;
        
        // Bind methods to maintain context
        this.gameLoop = this.gameLoop.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Handle window focus/blur for performance
        window.addEventListener('blur', () => {
            if (this.gameState.isState(GameState.STATES.PLAYING)) {
                this.pauseGame();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        // Optionally handle canvas resizing here
        // This depends on your game's responsive design needs
    }

    handleEscapeKey() {
        if (this.gameState.isState(GameState.STATES.SHOP)) {
            this.closeShop();
        } else if (this.gameState.isState(GameState.STATES.PLAYING)) {
            this.pauseGame();
        } else if (this.gameState.isState(GameState.STATES.PAUSED)) {
            this.resumeGame();
        }
    }

    async init() {
        try {
            this.gameState.setState(GameState.STATES.INITIALIZING);
            
            // Load any initial sprites or assets
            await this.loadAssets();
            
            // Load saved game or generate new city
            await this.loadGame();
            
            this.gameState.setState(GameState.STATES.MENU);
            this.showMainMenu();
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            // Fallback initialization
            this.generateCity();
            this.gameState.setState(GameState.STATES.MENU);
            this.showMainMenu();
        }
    }

    async loadAssets() {
        // Pre-load any global sprites or assets here
        // This is where you'd load UI sprites, particle effects, etc.
        try {
            // Example: await this.spriteManager.loadSprite('ui_elements', 'src/assets/ui/ui_sheet.png', 32, 32, uiAnimations);
            console.log('Assets loaded successfully');
        } catch (error) {
            console.warn('Some assets failed to load, using fallbacks:', error);
        }
    }

    async loadGame() {
        try {
            const savedGame = localStorage.getItem('adrenalineRushSave');
            if (savedGame) {
                const gameData = JSON.parse(savedGame);
                await this.loadGameData(gameData);
                console.log('Saved game loaded successfully');
            } else {
                this.generateCity();
                console.log('New game started');
            }
        } catch (error) {
            console.error('Error loading game:', error);
            this.generateCity();
        }
    }

    async loadGameData(gameData) {
        // Load player data
        this.player.load(gameData.player);
        
        // Load game state
        this.purchaseCount = gameData.purchaseCount || 0;
        this.supplies = gameData.supplies || [];
        this.cashItems = gameData.cashItems || [];
        this.police = gameData.police || [];
        this.dealers = gameData.dealers || [];
        
        // Load world data
        this.buildings = gameData.buildings || [];
        this.streets = gameData.streets || [];
        
        // Regenerate city if no buildings saved
        if (this.buildings.length === 0) {
            this.generateCity();
        }
        
        // Ensure minimum supplies and cash are present
        this.respawnSuppliesAndCash();
    }

    saveGame() {
        try {
            const gameData = {
                player: this.player.save(),
                purchaseCount: this.purchaseCount,
                supplies: this.supplies,
                cashItems: this.cashItems,
                police: this.police.map(cop => ({
                    x: cop.x,
                    y: cop.y,
                    size: cop.size,
                    speed: cop.speed,
                    alertRadius: cop.alertRadius
                })),
                dealers: this.dealers,
                buildings: this.buildings,
                streets: this.streets,
                timestamp: Date.now()
            };
            
            localStorage.setItem('adrenalineRushSave', JSON.stringify(gameData));
            console.log('Game saved successfully');
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }

    startGame() {
        if (!this.gameState.canTransitionTo(GameState.STATES.PLAYING)) {
            console.warn('Cannot start game from current state:', this.gameState.currentState);
            return;
        }
        
        this.gameState.setState(GameState.STATES.PLAYING);
        this.startTime = Date.now();
        this.lastFrameTime = 0;
        this.elapsedTime = 0;
        
        this.audioManager.startBackgroundMusic();
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop);
        
        console.log('Game started');
    }

    pauseGame() {
        if (!this.gameState.canTransitionTo(GameState.STATES.PAUSED)) return;
        
        this.gameState.setState(GameState.STATES.PAUSED);
        this.audioManager.stopBackgroundMusic();
        this.saveGame();
        
        // Show pause UI
        this.uiManager.showPauseScreen();
        
        console.log('Game paused');
    }

    resumeGame() {
        if (!this.gameState.canTransitionTo(GameState.STATES.PLAYING)) return;
        
        this.gameState.setState(GameState.STATES.PLAYING);
        
        // Adjust start time to account for pause duration
        this.startTime = Date.now() - (this.elapsedTime * 1000);
        this.lastFrameTime = 0;
        
        this.audioManager.startBackgroundMusic();
        this.uiManager.hidePauseScreen();
        
        // Resume game loop
        requestAnimationFrame(this.gameLoop);
        
        console.log('Game resumed');
    }

    showMainMenu() {
        this.uiManager.showMainMenu();
    }

    generateCity() {
        console.log('Generating new city...');
        const city = this.cityGenerator.generate();
        this.buildings = city.buildings;
        this.streets = city.streets;
        
        // Spawn game entities
        this.spawnDealers();
        this.spawnSupplies();
        
        console.log(`City generated with ${this.buildings.length} buildings`);
    }

    spawnDealers() {
        this.dealers = GAME_CONFIG.DEALER.POSITIONS.map((pos, index) => ({
            id: index,
            x: pos.x,
            y: pos.y,
            size: GAME_CONFIG.DEALER.SIZE,
            lastShopTime: 0,
            cooldownTime: GAME_CONFIG.DEALER.COOLDOWN_TIME || 10000 // 10 seconds default
        }));
        
        console.log(`Spawned ${this.dealers.length} dealers`);
    }

    spawnSupplies() {
        // Clear existing supplies and cash
        this.supplies = [];
        this.cashItems = [];
        
        // Spawn ice crystals (supplies)
        this.spawnSupplyType(this.supplies, GAME_CONFIG.SUPPLY.COUNT, 'supply');
        
        // Spawn cash items
        this.spawnSupplyType(this.cashItems, GAME_CONFIG.CASH.COUNT, 'cash');
        
        console.log(`Spawned ${this.supplies.length} supplies and ${this.cashItems.length} cash items`);
    }

    spawnSupplyType(array, count, type) {
        const config = type === 'supply' ? GAME_CONFIG.SUPPLY : GAME_CONFIG.CASH;
        
        while (array.length < count) {
            let attempts = 0;
            let item;
            
            do {
                if (type === 'supply') {
                    item = {
                        x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                        y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                        size: config.SIZE,
                        cost: config.MIN_COST + Math.random() * (config.MAX_COST - config.MIN_COST),
                        glow: Math.random() * Math.PI * 2,
                        glowSpeed: 0.02 + Math.random() * 0.03
                    };
                } else {
                    item = {
                        x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
                        y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20,
                        size: config.SIZE,
                        value: config.MIN_VALUE + Math.random() * (config.MAX_VALUE - config.MIN_VALUE),
                        glow: Math.random() * Math.PI * 2,
                        glowSpeed: 0.02 + Math.random() * 0.03
                    };
                }
                
                attempts++;
            } while (
                (!this.isValidPosition(item.x, item.y, item.size) ||
                 this.isOverlappingAny(item, this.supplies) ||
                 this.isOverlappingAny(item, this.cashItems)) &&
                attempts < 100
            );
            
            if (attempts < 100) {
                array.push(item);
            } else {
                console.warn(`Failed to spawn ${type} after 100 attempts`);
                break;
            }
        }
    }

    isOverlappingAny(obj, arr) {
        for (let i = 0; i < arr.length; i++) {
            const other = arr[i];
            const dist = Math.sqrt((obj.x - other.x) ** 2 + (obj.y - other.y) ** 2);
            if (dist < obj.size + other.size + 10) { // 10px minimum separation
                return true;
            }
        }
        return false;
    }

    spawnPolice() {
        let attempts = 0;
        let cop;
        
        do {
            // Spawn police at the edges of the screen
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            switch(side) {
                case 0: // top
                    x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
                    y = -20;
                    break;
                case 1: // right
                    x = GAME_CONFIG.CANVAS_WIDTH + 20;
                    y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
                    break;
                case 2: // bottom
                    x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
                    y = GAME_CONFIG.CANVAS_HEIGHT + 20;
                    break;
                case 3: // left
                    x = -20;
                    y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
                    break;
            }
            
            cop = {
                id: Date.now() + Math.random(), // Unique ID
                x: x,
                y: y,
                size: GAME_CONFIG.POLICE.SIZE,
                speed: GAME_CONFIG.POLICE.MIN_SPEED + Math.random() * (GAME_CONFIG.POLICE.MAX_SPEED - GAME_CONFIG.POLICE.MIN_SPEED),
                alertRadius: GAME_CONFIG.POLICE.ALERT_RADIUS,
                patrolTarget: null,
                state: 'patrol', // 'patrol' or 'chase'
                lastStateChange: Date.now()
            };
            
            attempts++;
        } while (attempts < 50); // Reduced attempts since spawning at edges
        
        if (attempts < 50) {
            this.police.push(cop);
            this.audioManager.playSound('policeSpawn');
            console.log('Police officer spawned');
        }
    }

    isValidPosition(x, y, size) {
        // Check canvas boundaries
        if (x - size < 0 || x + size > GAME_CONFIG.CANVAS_WIDTH || 
            y - size < 0 || y + size > GAME_CONFIG.CANVAS_HEIGHT) {
            return false;
        }
        
        // Check building collisions
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

    update(deltaTime) {
        if (!this.gameState.isState(GameState.STATES.PLAYING)) return;
        
        // Update elapsed time
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        
        // Update game entities with delta time for smooth animation
        this.player.update(this.buildings, deltaTime);
        this.updatePolice(deltaTime);
        this.updateSupplies(deltaTime);
        this.updateCashItems(deltaTime);
        this.updateSmokeParticles(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Respawn items if needed
        this.respawnSuppliesAndCash();
        
        // Check win/lose conditions
        this.checkGameConditions();
        
        // Update UI
        this.uiManager.updateUI(this.player, this.elapsedTime);
    }

    updateSupplies(deltaTime) {
        this.supplies.forEach(supply => {
            supply.glow += supply.glowSpeed;
        });
    }

    updateCashItems(deltaTime) {
        this.cashItems.forEach(cash => {
            cash.glow += cash.glowSpeed;
        });
    }

    updateSmokeParticles(deltaTime) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const particle = this.smokeParticles[i];
            particle.life -= 0.016; // Roughly 60fps decay rate
            
            if (particle.life <= 0) {
                this.smokeParticles.splice(i, 1);
                continue;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy -= 0.08; // Float upward
            particle.size *= 1.01; // Grow slightly
        }
    }

    updatePolice(deltaTime) {
        // Calculate target police count based on player money
        const targetPoliceCount = Math.min(
            GAME_CONFIG.POLICE.MAX_COUNT,
            Math.floor((this.player.money - GAME_CONFIG.POLICE.MONEY_THRESHOLD) / 100)
        );
        
        // Spawn police if needed
        if (targetPoliceCount > this.police.length && this.police.length < GAME_CONFIG.POLICE.MAX_COUNT) {
            const timeSinceLastSpawn = Date.now() - (this.lastPoliceSpawn || 0);
            if (timeSinceLastSpawn > 3000) { // 3 second minimum between spawns
                this.spawnPolice();
                this.lastPoliceSpawn = Date.now();
            }
        }

        // Update existing police
        this.police.forEach((cop, index) => {
            const distToPlayer = this.getDistance(this.player, cop);
            
            if (distToPlayer < cop.alertRadius) {
                // Chase behavior
                cop.state = 'chase';
                const angle = Math.atan2(this.player.y - cop.y, this.player.x - cop.x);
                const newX = cop.x + Math.cos(angle) * cop.speed;
                const newY = cop.y + Math.sin(angle) * cop.speed;
                
                if (this.isValidPosition(newX, newY, cop.size)) {
                    cop.x = newX;
                    cop.y = newY;
                }
            } else {
                // Patrol behavior
                cop.state = 'patrol';
                if (!cop.patrolTarget || this.getDistance(cop, cop.patrolTarget) < 20) {
                    // Set new patrol target
                    cop.patrolTarget = {
                        x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 100) + 50,
                        y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 100) + 50
                    };
                }
                
                const angle = Math.atan2(cop.patrolTarget.y - cop.y, cop.patrolTarget.x - cop.x);
                const patrolSpeed = cop.speed * 0.6; // Slower patrol speed
                const newX = cop.x + Math.cos(angle) * patrolSpeed;
                const newY = cop.y + Math.sin(angle) * patrolSpeed;
                
                if (this.isValidPosition(newX, newY, cop.size)) {
                    cop.x = newX;
                    cop.y = newY;
                }
            }
            
            // Remove police that are too far from screen
            if (cop.x < -100 || cop.x > GAME_CONFIG.CANVAS_WIDTH + 100 ||
                cop.y < -100 || cop.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
                this.police.splice(index, 1);
            }
        });
    }

    checkGameConditions() {
        // Check if player's buzz has depleted (withdrawal)
        if (this.player.updateBuzz(this.purchaseCount)) {
            this.gameOverReason = "WITHDRAWAL";
            this.gameOver();
            return;
        }
        
        // Check other win/lose conditions here
        // Example: survival time goals, money targets, etc.
    }

    checkCollisions() {
        this.collisionManager.checkCollisions();
    }

    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, GAME_CONFIG.COLORS.BACKGROUND[0]);
        gradient.addColorStop(1, GAME_CONFIG.COLORS.BACKGROUND[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // Draw city elements
        this.cityGenerator.draw(this.ctx);

        // Draw game objects in layered order
        this.drawDealers();
        this.drawSupplies();
        this.drawCashItems();
        this.drawSmokeParticles();
        this.drawPolice();
        
        // Draw player last so it appears on top
        this.player.draw(this.ctx);
        
        // Draw debug info if enabled
        if (GAME_CONFIG.DEBUG?.ENABLED) {
            this.drawDebugInfo();
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`Police: ${this.police.length}`, 15, 25);
        this.ctx.fillText(`Supplies: ${this.supplies.length}`, 15, 40);
        this.ctx.fillText(`Cash: ${this.cashItems.length}`, 15, 55);
        this.ctx.fillText(`Buzz: ${this.player.buzz.toFixed(1)}`, 15, 70);
        this.ctx.fillText(`FPS: ${Math.round(1000 / (Date.now() - this.lastFrameTime))}`, 15, 85);
    }

    drawDealers() {
        this.dealers.forEach((dealer, index) => {
            const isOnCooldown = (Date.now() - dealer.lastShopTime) < dealer.cooldownTime;
            
            // Dealer glow (dimmed if on cooldown)
            const glowGradient = this.ctx.createRadialGradient(
                dealer.x, dealer.y, 0,
                dealer.x, dealer.y, dealer.size * 2
            );
            const glowColor = isOnCooldown ? 'rgba(255, 165, 0, 0.3)' : 'rgba(255, 165, 0, 0.6)';
            glowGradient.addColorStop(0, glowColor);
            glowGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(dealer.x - dealer.size * 2, dealer.y - dealer.size * 2, dealer.size * 4, dealer.size * 4);

            // Motorcycle body
            this.ctx.fillStyle = isOnCooldown ? '#444' : '#222';
            this.ctx.fillRect(dealer.x - 12, dealer.y - 4, 24, 8);

            // Motorcycle wheels
            this.ctx.fillStyle = isOnCooldown ? '#666' : '#444';
            this.ctx.beginPath();
            this.ctx.arc(dealer.x - 8, dealer.y + 2, 6, 0, Math.PI * 2);
            this.ctx.arc(dealer.x + 8, dealer.y + 2, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Wheel spokes
            this.ctx.strokeStyle = isOnCooldown ? '#888' : '#666';
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
            this.ctx.fillStyle = isOnCooldown ? '#777' : '#555';
            this.ctx.fillRect(dealer.x - 10, dealer.y - 8, 20, 3);

            // Exhaust pipes
            this.ctx.fillStyle = isOnCooldown ? '#aaa' : '#888';
            this.ctx.fillRect(dealer.x + 6, dealer.y - 2, 8, 2);

            // Headlight
            this.ctx.fillStyle = isOnCooldown ? '#ffeb7d' : '#ffeb3b';
            this.ctx.beginPath();
            this.ctx.arc(dealer.x - 10, dealer.y - 2, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Cooldown indicator
            if (isOnCooldown) {
                const cooldownProgress = (Date.now() - dealer.lastShopTime) / dealer.cooldownTime;
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.fillRect(dealer.x - 15, dealer.y - 20, 30 * (1 - cooldownProgress), 3);
            }
        });
    }

    drawSupplies() {
        this.supplies.forEach(supply => {
            // Animated glow
            const glowIntensity = 0.4 + Math.sin(supply.glow) * 0.2;
            const glowGradient = this.ctx.createRadialGradient(
                supply.x, supply.y, 0,
                supply.x, supply.y, supply.size * 2.5
            );
            glowGradient.addColorStop(0, `rgba(173, 216, 230, ${glowIntensity})`);
            glowGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(supply.x - supply.size * 2.5, supply.y - supply.size * 2.5, supply.size * 5, supply.size * 5);
            
            // Supply crystal with rotation
            this.ctx.save();
            this.ctx.translate(supply.x, supply.y);
            this.ctx.rotate(supply.glow * 0.5);
            
            this.ctx.fillStyle = GAME_CONFIG.COLORS.SUPPLY.BASE;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -supply.size);
            this.ctx.lineTo(supply.size, 0);
            this.ctx.lineTo(0, supply.size);
            this.ctx.lineTo(-supply.size, 0);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Inner crystal highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -supply.size * 0.5);
            this.ctx.lineTo(supply.size * 0.5, 0);
            this.ctx.lineTo(0, supply.size * 0.5);
            this.ctx.lineTo(-supply.size * 0.5, 0);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    drawCashItems() {
        this.cashItems.forEach(cash => {
            // Animated glow
            const glowIntensity = 0.4 + Math.sin(cash.glow) * 0.2;
            const glowGradient = this.ctx.createRadialGradient(
                cash.x, cash.y, 0,
                cash.x, cash.y, cash.size * 2.5
            );
            glowGradient.addColorStop(0, `rgba(46, 213, 115, ${glowIntensity})`);
            glowGradient.addColorStop(1, 'rgba(46, 213, 115, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(cash.x - cash.size * 2.5, cash.y - cash.size * 2.5, cash.size * 5, cash.size * 5);
            
            // Cash stack effect
            for (let i = 0; i < 3; i++) {
                this.ctx.fillStyle = `rgba(46, 213, 115, ${0.8 - i * 0.2})`;
                this.ctx.fillRect(cash.x - cash.size + i, cash.y - cash.size + i, cash.size * 1.8, cash.size * 1.2);
            }
            
            // Cash symbol
            this.ctx.fillStyle = GAME_CONFIG.COLORS.CASH.BASE;
            this.ctx.font = `bold ${cash.size * 1.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('$', cash.x, cash.y);
            this.ctx.fillText('$', cash.x, cash.y);
        });
    }

    drawPolice() {
        this.police.forEach(cop => {
            const isChasing = cop.state === 'chase';
            
            // Police glow (red when chasing, blue when patrolling)
            const glowColor = isChasing ? 'rgba(255, 0, 0, 0.6)' : 'rgba(0, 102, 204, 0.6)';
            const glowGradient = this.ctx.createRadialGradient(
                cop.x, cop.y, 0,
                cop.x, cop.y, cop.size * 1.5
            );
            glowGradient.addColorStop(0, glowColor);
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(cop.x - cop.size * 1.5, cop.y - cop.size * 1.5, cop.size * 3, cop.size * 3);
            
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
            
            // Alert radius (debug)
            if (GAME_CONFIG.DEBUG?.SHOW_POLICE_RADIUS) {
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(cop.x, cop.y, cop.alertRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }

    drawSmokeParticles() {
        this.smokeParticles.forEach(particle => {
            this.ctx.fillStyle = `rgba(200, 200, 200, ${particle.life * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    createSmokeParticles(x, y) {
        const particleCount = GAME_CONFIG.MECHANICS?.SMOKE_PARTICLES || 5;
        for (let i = 0; i < particleCount; i++) {
            this.smokeParticles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 1, // Always float upward
                size: Math.random() * 3 + 2,
                life: 1.0
            });
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.gameState.isState(GameState.STATES.PLAYING)) return;

        // Calculate delta time for smooth animations
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update game state
        this.update(deltaTime);
        
        // Render everything
        this.render();
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop);
    }

    gameOver() {
        this.gameState.setState(GameState.STATES.GAME_OVER, { reason: this.gameOverReason });
        const survivalTime = Math.floor(this.elapsedTime);
        
        this.uiManager.showGameOver(this.gameOverReason, survivalTime, this.player.money);
        this.audioManager.playGameOverSound();
        this.audioManager.stopBackgroundMusic();
        
        // Save final game state
        this.saveGame();
        
        console.log(`Game Over: ${this.gameOverReason}, Survival Time: ${survivalTime}s`);
    }

    restartGame() {
        console.log('Restarting game...');
        
        // Reset player
        this.player.reset();
        
        // Reset game state
        this.purchaseCount = 0;
        this.supplies = [];
        this.cashItems = [];
        this.police = [];
        this.smokeParticles = [];
        this.gameOverReason = "";
        this.currentDealerIndex = null;
        
        // Hide game over UI
        this.uiManager.hideGameOver();
        
        // Generate new city
        this.generateCity();
        
        // Start the game
        this.startGame();
    }

    openShop(dealerIndex) {
        if (!this.gameState.canTransitionTo(GameState.STATES.SHOP)) return;
        
        // Check if dealer is on cooldown
        const dealer = this.dealers[dealerIndex];
        if (dealer && (Date.now() - dealer.lastShopTime) < dealer.cooldownTime) {
            this.audioManager.playSound('error');
            return;
        }
        
        this.currentDealerIndex = dealerIndex;
        this.gameState.setState(GameState.STATES.SHOP);
        this.uiManager.showShop();
        this.uiManager.updateShopPrices(this.purchaseCount);
        this.audioManager.playShopSound();
        
        console.log(`Opened shop with dealer ${dealerIndex}`);
    }

    closeShop() {
        console.log('Closing shop...');
        
        this.uiManager.hideShop();
        this.gameState.setState(GameState.STATES.PLAYING);
        
        // Restore game timing
        this.startTime = Date.now() - (this.elapsedTime * 1000);
        
        // Set dealer cooldown and move player away
        if (this.currentDealerIndex !== null && this.dealers[this.currentDealerIndex]) {
            const dealer = this.dealers[this.currentDealerIndex];
            dealer.lastShopTime = Date.now();
            
            // Move player away from dealer to prevent immediate re-interaction
            this.movePlayerAwayFromDealer(dealer);
            
            console.log(`Set cooldown for dealer ${this.currentDealerIndex}`);
        }
        
        this.currentDealerIndex = null;
        
        // Resume game loop
        requestAnimationFrame(this.gameLoop);
    }

    movePlayerAwayFromDealer(dealer) {
        const minDistance = dealer.size + this.player.size + 30;
        let attempts = 0;
        let newX, newY;
        
        do {
            const angle = Math.random() * 2 * Math.PI;
            newX = dealer.x + Math.cos(angle) * minDistance;
            newY = dealer.y + Math.sin(angle) * minDistance;
            attempts++;
        } while (
            (!this.isValidPosition(newX, newY, this.player.size) || 
             this.isNearOtherDealer(newX, newY, this.currentDealerIndex)) &&
            attempts < 20
        );
        
        if (attempts < 20) {
            this.player.x = newX;
            this.player.y = newY;
        }
    }

    isNearOtherDealer(x, y, excludeIndex) {
        for (let i = 0; i < this.dealers.length; i++) {
            if (i === excludeIndex) continue;
            
            const dealer = this.dealers[i];
            const dist = this.getDistance({ x, y }, dealer);
            if (dist < dealer.size + this.player.size + 15) {
                return true;
            }
        }
        return false;
    }

    buySupply(index) {
        const supply = GAME_CONFIG.SHOP.SUPPLIES[index];
        const cost = Math.floor(supply.cost * (1 + this.purchaseCount * GAME_CONFIG.SHOP.PRICE_MULTIPLIER));
        
        if (this.player.money >= cost) {
            this.player.money -= cost;
            this.player.buzz = Math.min(this.player.maxBuzz, this.player.buzz + supply.buzzGain);
            this.purchaseCount++;
            
            // Update UI
            this.uiManager.updateShopPrices(this.purchaseCount);
            this.uiManager.updateUI(this.player, this.elapsedTime);
            
            // Play sound effects
            this.audioManager.playExhaleSound();
            
            // Create smoke effect
            this.createSmokeParticles(this.player.x, this.player.y);
            
            console.log(`Bought supply ${index} for $${cost}`);
        } else {
            this.audioManager.playSound('error');
            console.log(`Cannot afford supply ${index} (costs $${cost}, have $${this.player.money})`);
        }
    }

    respawnSuppliesAndCash() {
        // Respawn supplies if below minimum count
        this.spawnSupplyType(this.supplies, GAME_CONFIG.SUPPLY.COUNT, 'supply');
        
        // Respawn cash if below minimum count
        this.spawnSupplyType(this.cashItems, GAME_CONFIG.CASH.COUNT, 'cash');
    }

    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Utility methods for external access
    getPlayer() {
        return this.player;
    }

    getGameState() {
        return this.gameState;
    }

    getSpriteManager() {
        return this.spriteManager;
    }
}