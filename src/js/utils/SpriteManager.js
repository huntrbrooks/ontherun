export class SpriteManager {
    constructor() {
        this.sprites = {};
        this.animations = {};
        this.currentAnimation = null;
        this.frameIndex = 0;
        this.frameCount = 0;
        this.frameDelay = 5; // frames between animation updates
    }

    loadSprite(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[name] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    defineAnimation(name, frames, loop = true) {
        this.animations[name] = {
            frames,
            loop,
            currentFrame: 0
        };
    }

    playAnimation(name) {
        if (this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.frameIndex = 0;
            this.frameCount = 0;
        }
    }

    update() {
        if (!this.currentAnimation || !this.animations[this.currentAnimation]) return;

        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            const animation = this.animations[this.currentAnimation];
            this.frameIndex = (this.frameIndex + 1) % animation.frames.length;
            
            if (!animation.loop && this.frameIndex === animation.frames.length - 1) {
                this.currentAnimation = null;
            }
        }
    }

    draw(ctx, x, y, width, height, flipX = false) {
        if (!this.currentAnimation || !this.animations[this.currentAnimation]) return;

        const animation = this.animations[this.currentAnimation];
        const frame = animation.frames[this.frameIndex];
        const sprite = this.sprites[frame.sprite];

        if (!sprite) return;

        ctx.save();
        if (flipX) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            x = 0;
        }

        ctx.drawImage(
            sprite,
            frame.x, frame.y, frame.width, frame.height,
            x, y, width, height
        );

        ctx.restore();
    }
} 