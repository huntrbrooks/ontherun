import { GAME_CONFIG } from '../config/gameConfig.js';
import { AnimationManager } from '../utils/AnimationManager.js';

export class Player {
    constructor(spriteManager) {
        // Core properties
        this.x = GAME_CONFIG.CANVAS_WIDTH / 2;
        this.y = GAME_CONFIG.CANVAS_HEIGHT / 2;
        this.size = GAME_CONFIG.PLAYER.SIZE;
        this.speed = GAME_CONFIG.PLAYER.SPEED;
        this.money = GAME_CONFIG.PLAYER.STARTING_MONEY || 50;
        this.buzz = 0;
        this.maxBuzz = GAME_CONFIG.PLAYER.MAX_BUZZ;
        
        // Movement and animation
        this.direction = { x: 0, y: 0 };
        this.isMoving = false;
        this.facingLeft = false;
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Sprite management
        this.spriteManager = spriteManager;
        this.animationManager = null;
        this.useDefaultSprite = false;
        
        // Input handling
        this.keys = {};
        this.setupInputHandlers();
        
        // Load sprites
        this.loadSprites();
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.key] = true; // Keep both for compatibility
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.key] = false; // Keep both for compatibility
        });

        // Make keys globally accessible for compatibility
        window.keys = this.keys;
    }

    async loadSprites() {
        try {
            // Define your character animations with frame positions
            const playerAnimations = {
                idle: {
                    frames: [
                        { x: 0, y: 0 },    // Frame 1
                        { x: 32, y: 0 },   // Frame 2
                        { x: 64, y: 0 },   // Frame 3
                        { x: 96, y: 0 }    // Frame 4
                    ]
                },
                walk: {
                    frames: [
                        { x: 0, y: 32 },   // Walking frame 1
                        { x: 32, y: 32 },  // Walking frame 2
                        { x: 64, y: 32 },  // Walking frame 3
                        { x: 96, y: 32 },  // Walking frame 4
                        { x: 128, y: 32 }, // Walking frame 5
                        { x: 160, y: 32 }  // Walking frame 6
                    ]
                },
                run: {
                    frames: [
                        { x: 0, y: 64 },   // Running frame 1
                        { x: 32, y: 64 },  // Running frame 2
                        { x: 64, y: 64 },  // Running frame 3
                        { x: 96, y: 64 }   // Running frame 4
                    ]
                }
            };

            // Load the player sprite sheet
            const sprite = await this.spriteManager.loadSprite(
                'player',
                'src/assets/sprites/player_spritesheet.png', // Single sprite sheet
                32, 32,  // Frame width and height
                playerAnimations
            );

            // Initialize animation manager
            this.animationManager = new AnimationManager(sprite, 'idle');
            this.animationManager.animationSpeed = 120; // Adjust for your preference

            console.log('Player sprites loaded successfully');
        } catch (error) {
            console.warn('Failed to load player sprites, using fallback:', error);
            this.useDefaultSprite = true;
        }
    }

    update(buildings, deltaTime = 16) {
        this.lastX = this.x;
        this.lastY = this.y;

        // Handle movement input
        this.handleMovement();
        
        // Apply movement with collision detection
        this.applyMovement(buildings);
        
        // Keep player in bounds
        this.constrainToBounds();
        
        // Update animation state
        this.updateAnimationState();
        
        // Update sprite animation
        if (this.animationManager) {
            this.animationManager.update(deltaTime);
        }
    }

    handleMovement() {
        // Reset direction
        this.direction = { x: 0, y: 0 };
        
        // Check input keys
        const inputMap = {
            'w': { x: 0, y: -1 },
            's': { x: 0, y: 1 },
            'a': { x: -1, y: 0 },
            'd': { x: 1, y: 0 },
            'arrowup': { x: 0, y: -1 },
            'arrowdown': { x: 0, y: 1 },
            'arrowleft': { x: -1, y: 0 },
            'arrowright': { x: 1, y: 0 }
        };

        // Apply input
        Object.entries(inputMap).forEach(([key, dir]) => {
            if (this.keys[key]) {
                this.direction.x += dir.x;
                this.direction.y += dir.y;
            }
        });

        // Normalize diagonal movement
        if (this.direction.x !== 0 && this.direction.y !== 0) {
            const length = Math.sqrt(this.direction.x ** 2 + this.direction.y ** 2);
            this.direction.x /= length;
            this.direction.y /= length;
        }

        // Determine if moving
        this.isMoving = this.direction.x !== 0 || this.direction.y !== 0;
        
        // Track facing direction
        if (this.direction.x < 0) this.facingLeft = true;
        if (this.direction.x > 0) this.facingLeft = false;
    }

    applyMovement(buildings) {
        if (!this.isMoving) return;

        // Calculate speed (running vs walking)
        const currentSpeed = this.keys['shift'] ? this.speed * 1.5 : this.speed;
        
        // Calculate new position
        const newX = this.x + this.direction.x * currentSpeed;
        const newY = this.y + this.direction.y * currentSpeed;

        // Check collisions separately for X and Y
        let canMoveX = true;
        let canMoveY = true;

        for (const building of buildings) {
            if (this.checkBuildingCollision(newX, this.y, building)) {
                canMoveX = false;
            }
            if (this.checkBuildingCollision(this.x, newY, building)) {
                canMoveY = false;
            }
        }

        // Apply movement
        if (canMoveX) this.x = newX;
        if (canMoveY) this.y = newY;
    }

    constrainToBounds() {
        this.x = Math.max(this.size, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.size, this.y));
    }

    updateAnimationState() {
        if (!this.animationManager) return;

        if (this.isMoving) {
            // Check if running (holding shift) or walking
            if (this.keys['shift']) {
                this.animationManager.setAnimation('run');
                this.animationManager.animationSpeed = 80; // Faster animation for running
            } else {
                this.animationManager.setAnimation('walk');
                this.animationManager.animationSpeed = 120; // Normal walking speed
            }
        } else {
            this.animationManager.setAnimation('idle');
            this.animationManager.animationSpeed = 200; // Slower for idle
        }
    }

    draw(ctx) {
        if (this.animationManager && !this.useDefaultSprite) {
            this.drawAnimatedSprite(ctx);
        } else {
            this.drawFallbackSprite(ctx);
        }

        // Draw buzz effect
        this.drawBuzzEffect(ctx);
    }

    drawAnimatedSprite(ctx) {
        ctx.save();
        
        // Flip sprite if facing left
        if (this.facingLeft) {
            ctx.scale(-1, 1);
            this.animationManager.draw(ctx, -this.x, this.y, this.size * 2.5, this.size * 2.5);
        } else {
            this.animationManager.draw(ctx, this.x, this.y, this.size * 2.5, this.size * 2.5);
        }
        
        ctx.restore();
    }

    drawFallbackSprite(ctx) {
        // Original sprite drawing as fallback
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Player body (black hoodie)
        ctx.fillStyle = GAME_CONFIG.COLORS?.PLAYER?.BODY || '#1a1a1a';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 2, this.size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = GAME_CONFIG.COLORS?.PLAYER?.HOOD || '#0d0d0d';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, this.size * 0.8, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();

        // Player head (skin tone)
        ctx.fillStyle = GAME_CONFIG.COLORS?.PLAYER?.SKIN || '#ffdbac';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 4, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Black ski mask/balaclava
        ctx.fillStyle = GAME_CONFIG.COLORS?.PLAYER?.MASK || '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 4, this.size * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Eye holes in mask
        ctx.fillStyle = GAME_CONFIG.COLORS?.PLAYER?.SKIN || '#ffdbac';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 3, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (menacing)
        ctx.fillStyle = GAME_CONFIG.COLORS?.PLAYER?.EYES || '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 5, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 3, this.y - 5, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBuzzEffect(ctx) {
        if (this.buzz > 0) {
            const intensity = Math.min(0.4, this.buzz / this.maxBuzz);
            const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
            
            // Outer glow
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 2.5
            );
            gradient.addColorStop(0, `rgba(255, 255, 0, ${intensity * pulse})`);
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner glow
            ctx.fillStyle = `rgba(255, 255, 100, ${intensity * 0.3 * pulse})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    checkBuildingCollision(x, y, building) {
        return x - this.size < building.x + building.width &&
               x + this.size > building.x &&
               y - this.size < building.y + building.height &&
               y + this.size > building.y;
    }

    updateBuzz(purchaseCount) {
        const buzzLoss = GAME_CONFIG.MECHANICS?.BUZZ_LOSS_BASE || 0.12;
        const buzzIncrement = GAME_CONFIG.MECHANICS?.BUZZ_LOSS_INCREMENT || 0.02;
        
        this.buzz = Math.max(0, this.buzz - (buzzLoss + purchaseCount * buzzIncrement));
        return this.buzz <= 0; // Return true if buzz depleted
    }

    // Utility methods for game state
    save() {
        return {
            x: this.x,
            y: this.y,
            money: this.money,
            buzz: this.buzz,
            maxBuzz: this.maxBuzz,
            facingLeft: this.facingLeft
        };
    }

    load(data) {
        if (!data) return;
        this.x = data.x ?? this.x;
        this.y = data.y ?? this.y;
        this.money = data.money ?? this.money;
        this.buzz = data.buzz ?? this.buzz;
        this.maxBuzz = data.maxBuzz ?? this.maxBuzz;
        this.facingLeft = data.facingLeft ?? this.facingLeft;
    }

    reset() {
        this.x = GAME_CONFIG.CANVAS_WIDTH / 2;
        this.y = GAME_CONFIG.CANVAS_HEIGHT / 2;
        this.money = GAME_CONFIG.PLAYER.STARTING_MONEY || 50;
        this.buzz = 0;
        this.direction = { x: 0, y: 0 };
        this.isMoving = false;
        this.facingLeft = false;
        
        if (this.animationManager) {
            this.animationManager.setAnimation('idle');
        }
    }

    // Getter methods for compatibility
    get isValidPosition() {
        return (x, y, buildings) => {
            for (let building of buildings) {
                if (this.checkBuildingCollision(x, y, building)) {
                    return false;
                }
            }
            return true;
        };
    }
}