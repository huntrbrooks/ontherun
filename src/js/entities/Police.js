import { GAME_CONFIG } from '../config/gameConfig.js';

export class Police {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.POLICE.SIZE;
        this.speed = GAME_CONFIG.POLICE.MIN_SPEED + 
                    Math.random() * (GAME_CONFIG.POLICE.MAX_SPEED - GAME_CONFIG.POLICE.MIN_SPEED);
        this.targetX = x;
        this.targetY = y;
        this.alertRadius = GAME_CONFIG.POLICE.ALERT_RADIUS;
    }

    update(playerX, playerY, buildings) {
        const distToPlayer = Math.sqrt(
            Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2)
        );
        
        if (distToPlayer < this.alertRadius) {
            // Chase player
            const angle = Math.atan2(playerY - this.y, playerX - this.x);
            const newX = this.x + Math.cos(angle) * this.speed;
            const newY = this.y + Math.sin(angle) * this.speed;
            
            if (this.isValidPosition(newX, newY, buildings)) {
                this.x = newX;
                this.y = newY;
            }
        } else {
            // Random patrol movement
            this.x += (Math.random() - 0.5) * 2;
            this.y += (Math.random() - 0.5) * 2;
            
            // Keep within bounds
            this.x = Math.max(this.size, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.size, this.x));
            this.y = Math.max(this.size, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.size, this.y));
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

    draw(ctx) {
        // Police glow
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2
        );
        glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
        glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(this.x - this.size * 2, this.y - this.size * 2, this.size * 4, this.size * 4);
        
        // Police body
        ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.BODY;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Police head
        ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.HEAD;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.6, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Police hat
        ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.HAT;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.8, this.size * 0.6, Math.PI, 2 * Math.PI);
        ctx.fill();
        
        // Badge
        ctx.fillStyle = GAME_CONFIG.COLORS.POLICE.BADGE;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.2, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - this.size * 0.7, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 2, this.y - this.size * 0.7, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}
