export class AudioManager {
    constructor() {
        this.sounds = {};
        this.initializeSounds();
    }

    initializeSounds() {
        const soundFiles = {
            exhale: 'src/assets/sounds/exhale.mp3',
            pickup: 'src/assets/sounds/pickup.mp3',
            gameOver: 'src/assets/sounds/gameover.mp3',
            shop: 'src/assets/sounds/shop.mp3'
        };

        // Try to load each sound, but don't fail if they're missing
        Object.entries(soundFiles).forEach(([name, path]) => {
            try {
                this.sounds[name] = new Audio(path);
                this.sounds[name].volume = 0.3;
            } catch (error) {
                console.warn(`Could not load sound: ${name}`);
                this.sounds[name] = null;
            }
        });
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {
                // Ignore play errors (e.g., if user hasn't interacted with page)
            });
        }
    }

    playExhaleSound() {
        this.playSound('exhale');
    }

    playPickupSound() {
        this.playSound('pickup');
    }

    playGameOverSound() {
        this.playSound('gameOver');
    }

    playShopSound() {
        this.playSound('shop');
    }
}
