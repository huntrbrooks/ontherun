export class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.3;
        this.muted = false;
        this.initializeSounds();
        this.setupVolumeControl();
    }

    initializeSounds() {
        const soundFiles = {
            exhale: 'src/assets/sounds/exhale.mp3',
            pickup: 'src/assets/sounds/pickup.mp3',
            gameOver: 'src/assets/sounds/gameover.mp3',
            shop: 'src/assets/sounds/shop.mp3',
            background: 'src/assets/sounds/background.mp3'
        };

        // Try to load each sound, but don't fail if they're missing
        Object.entries(soundFiles).forEach(([name, path]) => {
            try {
                const audio = new Audio();
                audio.src = path;
                audio.volume = this.volume;
                audio.loop = name === 'background';
                this.sounds[name] = audio;
                
                // Preload the audio
                audio.load();
            } catch (error) {
                console.warn(`Could not load sound: ${name}`, error);
                this.sounds[name] = null;
            }
        });
    }

    setupVolumeControl() {
        // Create volume control UI if it doesn't exist
        if (!document.getElementById('volumeControl')) {
            const volumeControl = document.createElement('div');
            volumeControl.id = 'volumeControl';
            volumeControl.style.position = 'fixed';
            volumeControl.style.bottom = '10px';
            volumeControl.style.right = '10px';
            volumeControl.style.zIndex = '1000';
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '1';
            slider.step = '0.1';
            slider.value = this.volume;
            
            const muteButton = document.createElement('button');
            muteButton.textContent = '🔊';
            muteButton.onclick = () => this.toggleMute();
            
            volumeControl.appendChild(slider);
            volumeControl.appendChild(muteButton);
            document.body.appendChild(volumeControl);
            
            slider.addEventListener('input', (e) => {
                this.setVolume(parseFloat(e.target.value));
            });
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.muted ? 0 : this.volume;
            }
        });
    }

    toggleMute() {
        this.muted = !this.muted;
        this.setVolume(this.volume);
        const muteButton = document.querySelector('#volumeControl button');
        if (muteButton) {
            muteButton.textContent = this.muted ? '🔇' : '🔊';
        }
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                sound.currentTime = 0;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn(`Could not play sound: ${soundName}`, error);
                    });
                }
            } catch (error) {
                console.warn(`Error playing sound: ${soundName}`, error);
            }
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

    startBackgroundMusic() {
        const background = this.sounds.background;
        if (background) {
            background.volume = this.muted ? 0 : this.volume * 0.5;
            this.playSound('background');
        }
    }

    stopBackgroundMusic() {
        const background = this.sounds.background;
        if (background) {
            background.pause();
            background.currentTime = 0;
        }
    }
}
