# Adrenaline Rush

A fast-paced arcade-style game where you play as a street runner trying to survive in a dangerous city.

## How to Play

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge recommended)
2. Use WASD or Arrow Keys to move your character
3. Collect cash (💵) to increase your money
4. Buy supplies from dealers (🏍️) to maintain your buzz
5. Avoid the police (👮‍♂️) who will chase you if you have too much money
6. Don't let your buzz drop to zero or you'll flatline!

## Game Features

- Dynamic city generation with buildings and streets
- Real-time police AI that chases you when you have too much money
- Shop system with increasing prices based on your purchase count
- Visual effects including smoke particles and glowing items
- Sound effects for various game events

## Controls

- **Movement**: WASD or Arrow Keys
- **Shop**: Press SPACEBAR when near a dealer
- **Restart**: Click the RESPAWN button after game over

## Game Mechanics

- Your buzz level decreases over time
- Buying supplies increases your buzz but costs money
- Police spawn when you have more than $1000
- Dealers will kill you if you have negative money
- Each purchase increases the price of future purchases

## Development

This game is built using vanilla JavaScript and HTML5 Canvas. No external dependencies are required.

### Project Structure

```
├── index.html          # Main game file
├── src/
│   ├── css/
│   │   └── style.css   # Game styles
│   ├── js/
│   │   ├── config/     # Game configuration
│   │   ├── entities/   # Game objects
│   │   ├── managers/   # Game systems
│   │   └── utils/      # Utility functions
│   └── assets/         # Game assets (sounds, images)
└── README.md           # This file
```

## Browser Compatibility

The game requires a modern web browser with support for:
- ES6 Modules
- HTML5 Canvas
- CSS3 Animations
- Web Audio API

## License

This project is open source and available under the MIT License. 