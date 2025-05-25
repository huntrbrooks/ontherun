import { GAME_CONFIG } from '../config/gameConfig.js';

export class Supply {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.SUPPLY.SIZE;
        this.cost = GAME_CONFIG.SUPPLY.MIN_COST + 
                   Math.random() * (GAME_CONFIG.SUPPLY.MAX_COST - GAME_CONFIG.SUPPLY.MIN_COST);
        this.glow = Math.random() * Math.PI * 2;
    }

    update() {
        this.glow += 0.1;
    }

    draw(ctx) {
        // Supply glow
        const glowIntensity = 0.6 + Math.sin(this.glow) * 0.4;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 3
        );
        glowGradient.addColorStop(0, `rgba(173, 216, 230, ${glowIntensity})`);
        glowGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(this.x - this.size * 2, this.y - this.size * 2, this.size * 4, this.size * 4);
        
        // Ice crystal base
        ctx.fillStyle = GAME_CONFIG.COLORS.SUPPLY.BASE;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // Snowflake symbol
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText('❄', this.x, this.y + 5);
        ctx.shadowBlur = 0;
    }
}
