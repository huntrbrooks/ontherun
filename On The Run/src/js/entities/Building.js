import { GAME_CONFIG } from '../config/gameConfig.js';

export class Building {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.color = this.getRandomBuildingColor();
        this.windows = this.generateWindows();
    }

    getRandomBuildingColor() {
        const colors = GAME_CONFIG.COLORS.BUILDINGS;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateWindows() {
        const windows = [];
        const windowSize = this.type === 'large' ? 8 : 6;
        const windowSpacing = this.type === 'large' ? 20 : 15;
        const margin = 10;

        for (let x = margin; x < this.width - margin; x += windowSpacing) {
            for (let y = margin; y < this.height - margin; y += windowSpacing) {
                if (Math.random() < 0.7) { // 70% chance of a window
                    windows.push({
                        x: this.x + x,
                        y: this.y + y,
                        size: windowSize,
                        lit: Math.random() < 0.3 // 30% chance of being lit
                    });
                }
            }
        }
        return windows;
    }

    draw(ctx) {
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 4, this.y + 4, this.width, this.height);

        // Building body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Windows
        this.windows.forEach(window => {
            ctx.fillStyle = window.lit ? '#ffd700' : '#333';
            ctx.fillRect(window.x, window.y, window.size, window.size);
        });

        // Building outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
