# Orb Survival - Phase 2

## New Feature: Long-Term Survival System with Foraging & Inventory

### What's New
- **Realistic Foraging System**: 8 designated forage areas that respawn over time
- **30-slot Inventory**: Large inventory for long-term resource management
- **Food Spoilage System**: Different foods spoil at different rates
- **Slow-Paced Survival**: Hunger depletes much slower for long-term gameplay
- **Strategic Food Management**: Choose when and what to eat based on freshness
- **Forage Cooldown**: 3-second cooldown between forage attempts

### How It Works

#### Foraging System
1. **Forage Areas**: 8 designated areas scattered across the world
2. **Visual Indicators**: Yellow dashed circles show available forage areas when nearby
3. **Respawn Mechanics**: Areas take 30 seconds to respawn after being foraged
4. **Rarity System**: Different foods have different spawn probabilities
5. **Range-Based**: Must be within 80 pixels of a forage area to collect

#### Food Types & Properties
- **🍎 Apple**: 15 hunger, moderate spoilage, common (30% chance)
- **🍄 Mushroom**: 12 hunger, high spoilage, common (40% chance)
- **🥜 Nuts**: 20 hunger, very low spoilage, rare (20% chance)
- **🌿 Herbs**: 8 hunger, very high spoilage, very common (50% chance)
- **🍯 Honey**: 25 hunger, extremely low spoilage, very rare (10% chance)
- **🥕 Root Vegetable**: 18 hunger, low spoilage, uncommon (25% chance)
- **🍇 Berries**: 10 hunger, high spoilage, common (35% chance)
- **🐟 Fish**: 30 hunger, very high spoilage, rare (15% chance)

#### Inventory System
1. **30-slot Grid**: 6 columns × 5 rows for extensive storage
2. **Smart Stacking**: Items of same type and similar freshness stack together
3. **Freshness Tracking**: Each item has a freshness value (0-100%)
4. **Visual Indicators**: 
   - Green border: Fresh food (>60% freshness)
   - Orange border: Getting old (30-60% freshness)
   - Red border: Spoiled (<30% freshness)
5. **Tooltips**: Hover over items to see detailed stats

#### Food Spoilage
- **Realistic Timing**: Food spoils over time based on type
- **Honey**: Lasts almost forever (0.0001 spoilage rate)
- **Nuts**: Very long-lasting (0.0005 spoilage rate)
- **Fish**: Spoils quickly (0.01 spoilage rate)
- **Herbs**: Very quick spoilage (0.008 spoilage rate)

### Gameplay Impact
- **Long-Term Planning**: Players must think about food preservation and storage
- **Exploration Incentive**: Must find and remember forage area locations
- **Resource Management**: Strategic decisions about when to eat vs. save food
- **Realistic Survival**: Much slower hunger depletion (50x slower than before)
- **Risk vs. Reward**: Rare foods provide more nutrition but are harder to find

### Controls
- **WASD/Arrow Keys**: Move around
- **Shift**: Sprint (uses stamina)
- **Left Click**: Destroy blocks/trees
- **Right Click**: Place blocks
- **F**: Forage in nearby area (3-second cooldown)
- **I**: Open/close inventory
- **1-9**: Eat food from inventory slots 1-9

### Technical Details
- **Hunger Depletion**: 0.02 per second (vs. 0.25 in original)
- **Forage Areas**: 8 areas with 30-second respawn timers
- **Inventory Size**: 30 slots with smart stacking
- **Food Types**: 8 different foods with unique properties
- **Spoilage System**: Real-time freshness tracking with visual feedback

### Strategic Elements
- **Forage Area Mapping**: Players learn where food sources are located
- **Food Preservation**: Prioritize eating foods that spoil quickly
- **Inventory Management**: Balance between carrying capacity and food variety
- **Timing**: Plan foraging trips around respawn timers
- **Risk Assessment**: Decide when to eat rare, high-nutrition foods

This system transforms the game from an arcade-style collection game into a thoughtful, long-term survival experience where food is a precious resource that requires careful management and planning.