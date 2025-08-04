# 2D Engine Physics Simulator

A versatile real-time 2D engine physics simulator built with HTML5 Canvas, featuring accurate animations of internal combustion engines with dual-view visualization (side view and top-down view).

## Features

### Engine Types
- **Inline 4-Cylinder ICE** - Complete with animated pistons, crankshaft, camshaft, and valve timing
- **V6 Engine** - 60-degree V-angle configuration with dual camshafts
- **Extensible Architecture** - Designed to support V8, rotary, turbine, and electric motors

### Physics Simulation
- **Accurate Piston Motion** - Real connecting rod geometry and piston position calculations
- **Crankshaft Animation** - Proper firing order and timing sequences
- **Valve Timing** - Realistic intake and exhaust valve operation based on camshaft rotation
- **Combustion Cycles** - Visual representation of the four-stroke cycle

### Visual Effects
- **Dual View System** - Simultaneous side view (cross-section) and top view (arrangement)
- **Combustion Visualization** - Dynamic radial gradient effects during ignition with realistic intensity
- **Exhaust Particle System** - Real-time 2D particle simulation for exhaust gases
- **Cutaway Mode** - Toggle transparent engine components for internal visibility
- **View Controls** - Switch between both views, side-only, or top-only display modes

### Interactive Controls
- **RPM Control** - 0-8000 RPM range with real-time animation speed adjustment
- **Throttle Position** - 0-100% with visual feedback on combustion intensity
- **Air-Fuel Ratio** - 10:1 to 20:1 range affecting performance calculations
- **Ignition Timing** - 0-40° BTDC adjustment
- **Boost Pressure** - 0-30 PSI turbocharger simulation

### Performance Metrics
- **Real-time Calculations** - Power, torque, efficiency, and temperature
- **Dynamic Labels** - Canvas-rendered component identification in both views
- **Performance Feedback** - Visual indicators for engine health and efficiency
- **Grid System** - Reference grids in both views for scale and alignment

## Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Architecture

### Base Engine Class (`src/engines/BaseEngine2D.js`)
- Common functionality for all 2D engine types
- Canvas rendering utilities and color definitions
- Dual-view rendering system (side and top views)
- Label management system
- Physics calculation utilities
- Combustion intensity algorithms

### Engine Implementations
- `Inline4Engine2D.js` - 4-cylinder inline configuration with side and top views
- `V6Engine2D.js` - V-type 6-cylinder with 60° bank angle visualization
- Extensible design for future engine types

### Effects System (`src/effects/ParticleSystem2D.js`)
- Canvas-based particle simulation
- Exhaust gas visualization in both views
- Dynamic emission rates based on engine parameters

### Controls (`src/utils/EngineControls.js`)
- Performance calculation algorithms
- Efficiency mapping functions
- Temperature simulation

## Technical Details

### Piston Motion Calculation
```javascript
calculatePistonPosition(crankAngle, rodLength, crankRadius) {
    const crankRad = THREE.MathUtils.degToRad(crankAngle);
    const cosA = Math.cos(crankRad);
    const sinA = Math.sin(crankRad);
    
    const beta = Math.asin((crankRadius * sinA) / rodLength);
    return crankRadius * cosA + rodLength * Math.cos(beta);
}
```

### Valve Timing
- Intake valves: Open 10° BTDC, Close 50° ABDC
- Exhaust valves: Open 50° BBDC, Close 10° ATDC
- Lift profiles follow sinusoidal curves for realistic motion

### Firing Orders
- Inline 4: 1-3-4-2
- V6: 1-4-2-5-3-6

## Controls

### View System
- **Side View**: Cross-sectional view showing piston motion, valve operation, and crankshaft rotation
- **Top View**: Top-down view showing cylinder arrangement and firing pattern
- **View Mode Selector**: Switch between both views, side-only, or top-only display

### Interface Controls
- **Engine Type**: Switch between Inline 4-Cylinder and V6 engine configurations
- **RPM Slider**: Control engine speed (0-8000 RPM) with real-time animation
- **Throttle**: Adjust power output (0-100%) affecting combustion intensity
- **Air-Fuel Ratio**: Tune mixture for performance/efficiency (10:1 to 20:1)
- **Ignition Timing**: Advance/retard spark timing (0-40° BTDC)
- **Boost Pressure**: Simulate turbocharger/supercharger (0-30 PSI)
- **Toggle Buttons**: Cutaway view, exhaust particles, component labels

## Future Enhancements

### Planned Engine Types
- **V8 Engine** - Cross-plane crankshaft configuration
- **Rotary Engine** - Wankel rotor animation
- **Gas Turbine** - Compressor, combustor, and turbine stages
- **Electric Motor** - Stator/rotor electromagnetic field visualization

### Advanced Features
- **Hybrid Systems** - Electric motor + ICE integration
- **Turbocharger Animation** - Compressor and turbine wheels
- **Cooling System** - Radiator and coolant flow visualization
- **Lubrication System** - Oil pump and circulation paths
- **Sound Synthesis** - Audio generation based on engine parameters

## Performance Optimization

- **Canvas-based Rendering** - Efficient 2D graphics with hardware acceleration
- **Selective View Rendering** - Only render active views to save performance
- **Optimized Particle Systems** - Efficient 2D particle simulation
- **Responsive Grid System** - Dynamic scaling based on canvas size

## Browser Compatibility

- **HTML5 Canvas** support required
- **Modern browsers** (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- **Hardware acceleration** recommended for smooth animation
- **Responsive design** - Automatically adapts to different screen sizes

## License

MIT License - Feel free to use and modify for educational and commercial purposes.