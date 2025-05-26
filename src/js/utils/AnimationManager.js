export class AnimationManager {
    constructor(sprite, initialAnimation = 'idle') {
        this.sprite = sprite;
        this.currentAnimation = initialAnimation;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.animationSpeed = 100; // milliseconds per frame
        this.lastFrameTime = 0;
        this.isPlaying = true;
        this.loop = true;
    }

    setAnimation(animationName, reset = false) {
        if (this.currentAnimation === animationName && !reset) return;
        
        this.currentAnimation = animationName;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    update(deltaTime) {
        if (!this.isPlaying || !this.sprite.animations[this.currentAnimation]) return;

        this.frameTimer += deltaTime;
        
        if (this.frameTimer >= this.animationSpeed) {
            const animation = this.sprite.animations[this.currentAnimation];
            this.currentFrame++;
            
            if (this.currentFrame >= animation.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = animation.frames.length - 1;
                    this.isPlaying = false;
                }
            }
            
            this.frameTimer = 0;
        }
    }

    getCurrentFrame() {
        const animation = this.sprite.animations[this.currentAnimation];
        if (!animation) return { x: 0, y: 0 }; // fallback
        
        return animation.frames[this.currentFrame] || animation.frames[0];
    }

    draw(ctx, x, y, width = null, height = null) {
        const frame = this.getCurrentFrame();
        const drawWidth = width || this.sprite.frameWidth;
        const drawHeight = height || this.sprite.frameHeight;
        
        ctx.drawImage(
            this.sprite.image,
            frame.x, frame.y,                    // Source position
            this.sprite.frameWidth, this.sprite.frameHeight,  // Source size
            x - drawWidth/2, y - drawHeight/2,   // Destination position (centered)
            drawWidth, drawHeight                // Destination size
        );
    }
}