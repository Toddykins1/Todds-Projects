# Top-Down Survival Game - Version B1

## New Feature: Collectible Items

This version adds a simple but impactful collectible system to the top-down survival game.

### What's New

- **Collectible Items**: Three types of resources spawn around the player:
  - 🍎 **Food** - Red colored items for sustenance
  - 🪵 **Wood** - Brown colored items for crafting materials  
  - 🪨 **Stone** - Gray colored items for building materials

- **Inventory System**: Real-time inventory counter in the HUD showing collected items
- **Smart Spawning**: Items spawn dynamically around the player with proper spacing
- **Visual Polish**: Items have floating animations, shadows, and smooth collection mechanics

### How It Works

- Items automatically spawn around the player as you explore
- Walk over any item to collect it instantly
- Your inventory is displayed in the top-right HUD
- Items are limited to prevent performance issues
- Old items are cleaned up when you move far away

### Technical Details

- **Collision Detection**: Simple distance-based collision between player and items
- **Performance Optimized**: Items only render when on screen, old items are removed
- **Visual Effects**: Floating animation, shadows, and smooth collection feedback
- **UI Integration**: Seamlessly integrated with existing HUD design

This simple addition transforms the game from a basic exploration experience into the foundation of a proper survival game, setting up future features like crafting, building, and resource management.

