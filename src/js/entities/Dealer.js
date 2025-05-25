import { GAME_CONFIG } from '../config/gameConfig.js';

export class Dealer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.DEALER.SIZE;
    }

    draw(ctx) {
        // Dealer glow
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        glowGradient.addColorStop(0, 'rgba(255, 165, 0, 0.6)');
        glowGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        
        // Motorcycle body (main frame)
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - 12, this.y - 4, 24, 8);
        
        // Motorcycle wheels
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y + 2, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y + 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel spokes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y + 2);
            ctx.lineTo(this.x - 8 + Math.cos(angle) * 4, this.y + 2 + Math.sin(angle) * 4);
            ctx.moveTo(this.x + 8, this.y + 2);
            ctx.lineTo(this.x + 8 + Math.cos(angle) * 4, this.y + 2 + Math.sin(angle) * 4);
            ctx.stroke();
        }
        
        // Handlebars
        ctx.fillStyle = '#555';
        ctx.fillRect(this.x - 10, this.y - 8, 20, 3);
        
        // Exhaust pipes
        ctx.fillStyle = '#888';
        ctx.fillRect(this.x + 6, this.y - 2, 8, 2);
        
        // Headlight
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
