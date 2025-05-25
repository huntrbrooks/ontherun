import { GAME_CONFIG } from '../config/gameConfig.js';
import { Building } from '../entities/Building.js';

export class CityGenerator {
    constructor() {
        this.buildings = [];
        this.streets = [];
    }

    generate() {
        this.generateStreets();
        this.generateBuildings();
        return {
            buildings: this.buildings,
            streets: this.streets
        };
    }

    generateStreets() {
        const blockSize = GAME_CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = GAME_CONFIG.CITY.STREET_WIDTH;

        // Generate horizontal streets
        for (let y = blockSize; y < GAME_CONFIG.CANVAS_HEIGHT; y += blockSize) {
            this.streets.push({
                x: 0,
                y: y,
                width: GAME_CONFIG.CANVAS_WIDTH,
                height: streetWidth
            });
        }

        // Generate vertical streets
        for (let x = blockSize; x < GAME_CONFIG.CANVAS_WIDTH; x += blockSize) {
            this.streets.push({
                x: x,
                y: 0,
                width: streetWidth,
                height: GAME_CONFIG.CANVAS_HEIGHT
            });
        }
    }

    generateBuildings() {
        const blockSize = GAME_CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = GAME_CONFIG.CITY.STREET_WIDTH;
        const margin = GAME_CONFIG.CITY.BUILDING_MARGIN;

        for (let blockY = 0; blockY < GAME_CONFIG.CANVAS_HEIGHT; blockY += blockSize) {
            for (let blockX = 0; blockX < GAME_CONFIG.CANVAS_WIDTH; blockX += blockSize) {
                // Skip if this is a street intersection
                if (blockX % blockSize === 0 && blockY % blockSize === 0) continue;

                // Calculate building area
                const buildingArea = {
                    x: blockX + streetWidth + margin,
                    y: blockY + streetWidth + margin,
                    width: blockSize - (streetWidth * 2) - (margin * 2),
                    height: blockSize - (streetWidth * 2) - (margin * 2)
                };

                // Generate 1-3 buildings in this block
                const numBuildings = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numBuildings; i++) {
                    const buildingWidth = Math.random() * (buildingArea.width / 2) + 20;
                    const buildingHeight = Math.random() * (buildingArea.height / 2) + 20;
                    const x = buildingArea.x + Math.random() * (buildingArea.width - buildingWidth);
                    const y = buildingArea.y + Math.random() * (buildingArea.height - buildingHeight);

                    this.buildings.push(new Building(
                        x,
                        y,
                        buildingWidth,
                        buildingHeight,
                        buildingWidth > 40 ? 'large' : 'small'
                        ));
                }
            }
        }
    }

    draw(ctx) {
        // Draw streets
        ctx.fillStyle = GAME_CONFIG.COLORS.STREETS;
        this.streets.forEach(street => {
            ctx.fillRect(street.x, street.y, street.width, street.height);
        });

        // Draw buildings
        this.buildings.forEach(building => {
            building.draw(ctx);
        });
    }
}
