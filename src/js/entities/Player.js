import { GAME_CONFIG } from '../config/gameConfig.js';

export class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = GAME_CONFIG.PLAYER.INITIAL_X;
        this.y = GAME_CONFIG.PLAYER.INITIAL_Y;
        this.size = GAME_CONFIG.PLAYER.SIZE;
        this.speed = GAME_CONFIG.PLAYER.SPEED;
        this.buzz = GAME_CONFIG.PLAYER.INITIAL_BUZZ;
        this.maxBuzz = GAME_CONFIG.PLAYER.MAX_BUZZ;
        this.money = GAME_CONFIG.PLAYER.INITIAL_MONEY;
    }

    update(buildings, keys) {
        let newX = this.x;
        let newY = this.y;

        // Handle movement input
        if (keys['w'] || keys['arrowup']) newY -= this.speed;
        if (keys['s'] || keys['arrowdown']) newY += this.speed;
        if (keys['a'] || keys['arrowleft']) newX -= this.speed;
        if (keys['d'] || keys['arrowright']) newX += this.speed;

        // Boundary checking
        newX = Math.max(this.size, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.size, newX));
        newY = Math.max(this.size, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.size, newY));

        // Building collision
        if (this.isValidPosition(newX, newY, buildings)) {
            this.x = newX;
            this.y = newY;
        }
    }

    isValidPosition(x, y, buildings) {
        for (let building of buildings) {
            if (x - this.size < building.x + building.width &&
                x + this.size > building.x &&
                y - this.size < building.y + building.height &&
                y + this.size > building.y) {
                return false;
            }
        }
        return true;
    }

    updateBuzz(purchaseCount) {
        const buzzLoss = GAME_CONFIG.MECHANICS.BUZZ_LOSS_BASE + 
                        (purchaseCount * GAME_CONFIG.MECHANICS.BUZZ_LOSS_INCREMENT);
        this.buzz -= buzzLoss;
        return this.buzz <= 0;
    }

    draw(ctx) {
        // Player shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Player body (black hoodie)
        ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER.BODY;
        ctx.beginPath();
        ctx.arc(this.x, this.y + 2, this.size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER.HOOD;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, this.size * 0.8, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();

        // Player head (skin tone)
        ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER.SKIN;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 4, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Black ski mask/balaclava
        ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER.MASK;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 4, this.size * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Eye holes in mask
        ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER.SKIN;
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 3, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (menacing)
        ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER.EYES;
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 5, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 3, this.y - 5, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}
