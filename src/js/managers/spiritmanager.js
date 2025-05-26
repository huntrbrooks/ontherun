export class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loadingPromises = new Map();
    }

    async loadSprite(name, imagePath, frameWidth, frameHeight, animations) {
        if (this.sprites.has(name)) {
            return this.sprites.get(name);
        }

        // Prevent duplicate loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const sprite = {
                    image: img,
                    frameWidth,
                    frameHeight,
                    animations: animations || {},
                    totalFrames: Math.floor(img.width / frameWidth) * Math.floor(img.height / frameHeight)
                };
                this.sprites.set(name, sprite);
                resolve(sprite);
            };
            img.onerror = reject;
            img.src = imagePath;
        });

        this.loadingPromises.set(name, loadPromise);
        return loadPromise;
    }

    getSprite(name) {
        return this.sprites.get(name);
    }
}