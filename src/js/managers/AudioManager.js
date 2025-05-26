export class AudioManager {
    constructor() {
        this.sounds = {};
        this.masterVolume = 0.3;
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
                this.sounds[name].volume = this.masterVolume;
            } catch (error) {
                console.warn(`Could not load sound: ${name}`);
                this.sounds[name] = null;
            }
        });
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume for all loaded sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.masterVolume;
            }
        });
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound && this.masterVolume > 0) {
            sound.currentTime = 0;
            sound.volume = this.masterVolume;
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

    // Placeholder for background music
    playBackgroundMusic() {
        // Could implement background music here
    }

    stopBackgroundMusic() {
        // Could implement background music stopping here
    }
}