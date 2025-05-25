import { GAME_CONFIG } from '../config/gameConfig.js';

export class Cash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.CASH.SIZE;
        this.value = GAME_CONFIG.CASH.MIN_VALUE + 
                    Math.random() * (GAME_CONFIG.CASH.MAX_VALUE - GAME_CONFIG.CASH.MIN_VALUE);
        this.glow = Math.random() * Math.PI * 2;
    }

    update() {
        this.glow += 0.08;
    }

    draw(ctx) {
        // Cash glow
        const glowIntensity = 0.5 + Math.sin(this.glow) * 0.3;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2.5
        );
        glowGradient.addColorStop(0, `rgba(46, 213, 115, ${glowIntensity})`);
        glowGradient.addColorStop(1, 'rgba(46, 213, 115, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(this.x - this.size * 2, this.y - this.size * 2, this.size * 4, this.size * 4);
        
        // Cash item
        ctx.fillStyle = GAME_CONFIG.COLORS.CASH.BASE;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // Money symbol
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💵', this.x, this.y + 4);
    }
}
