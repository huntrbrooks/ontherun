export const GAME_CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Player settings
    PLAYER: {
        INITIAL_X: 100,
        INITIAL_Y: 100,
        SIZE: 12,
        SPEED: 3.5,
        INITIAL_BUZZ: 100,
        MAX_BUZZ: 100,
        INITIAL_MONEY: 50
    },
    
    // City generation
    CITY: {
        BLOCK_SIZE: 120,
        STREET_WIDTH: 30,
        BUILDING_MARGIN: 8
    },
    
    // Supply settings
    SUPPLY: {
        COUNT: 8,
        SIZE: 8,
        MIN_COST: 10,
        MAX_COST: 25,
        BUZZ_GAIN: 25
    },
    
    // Cash settings
    CASH: {
        COUNT: 6,
        SIZE: 10,
        MIN_VALUE: 20,
        MAX_VALUE: 50
    },
    
    // Police settings
    POLICE: {
        SIZE: 15,
        MIN_SPEED: 1.5,
        MAX_SPEED: 2.0,
        ALERT_RADIUS: 100,
        MONEY_THRESHOLD: 1000,
        SPAWN_INTERVAL: 5000
    },
    
    // Dealer settings
    DEALER: {
        SIZE: 25,
        POSITIONS: [
            {x: 150, y: 150},
            {x: 650, y: 150},
            {x: 150, y: 450},
            {x: 650, y: 450},
            {x: 400, y: 300}
        ]
    },
    
    // Shop settings
    SHOP: {
        PRICE_MULTIPLIER: 0.5,
        SUPPLIES: [
            { cost: 20, buzzGain: 50 },
            { cost: 50, buzzGain: 100 },
            { cost: 100, buzzGain: 200 }
        ]
    },
    
    // Game mechanics
    MECHANICS: {
        BUZZ_LOSS_BASE: 0.12,
        BUZZ_LOSS_INCREMENT: 0.02,
        SMOKE_PARTICLES: 8
    },
    
    // Colors
    COLORS: {
        BACKGROUND: ['#2c2c54', '#40407a'],
        BUILDINGS: [
            '#4a4a4a', '#5a5a5a', '#3a3a3a', '#6a6a6a',
            '#4a4a5a', '#5a4a4a', '#4a5a4a', '#454545',
            '#3a4a5a', '#5a3a4a', '#4a5a3a', '#505050',
            '#2a2a4a', '#4a2a2a', '#2a4a2a', '#404040'
        ],
        STREETS: '#1a1a1a',
        PLAYER: {
            BODY: '#1a1a1a',
            HOOD: '#0d0d0d',
            SKIN: '#ffdbac',
            MASK: '#000',
            EYES: '#ff0000'
        },
        POLICE: {
            BODY: '#0066cc',
            HEAD: '#ffdbac',
            HAT: '#003366',
            BADGE: '#ffd700'
        },
        SUPPLY: {
            BASE: '#add8e6'
        },
        CASH: {
            BASE: '#2ed573'
        }
    }
};
