export class EngineControls {
    constructor() {
        this.basePerformance = {
            maxPower: 200,      // HP
            maxTorque: 180,     // lb-ft
            maxEfficiency: 35,  // %
            baseTemp: 160       // °F
        };
    }
    
    calculatePerformance(settings) {
        const { rpm, throttle, airFuelRatio, ignitionTiming, boost } = settings;
        
        const rpmFactor = this.calculateRPMFactor(rpm);
        const throttleFactor = throttle / 100;
        const afrFactor = this.calculateAFRFactor(airFuelRatio);
        const timingFactor = this.calculateTimingFactor(ignitionTiming);
        const boostFactor = 1 + (boost * 0.05);
        
        const power = Math.round(
            this.basePerformance.maxPower * 
            rpmFactor * 
            throttleFactor * 
            afrFactor * 
            timingFactor * 
            boostFactor
        );
        
        const torque = Math.round(
            this.basePerformance.maxTorque * 
            (1 - rpmFactor * 0.3) * 
            throttleFactor * 
            afrFactor * 
            timingFactor * 
            boostFactor
        );
        
        const efficiency = Math.round(
            this.basePerformance.maxEfficiency * 
            afrFactor * 
            timingFactor * 
            (1 - Math.abs(throttleFactor - 0.7) * 0.5)
        );
        
        const temperature = Math.round(
            this.basePerformance.baseTemp + 
            (rpm / 100) + 
            (throttle * 0.8) + 
            (boost * 2) +
            ((Math.abs(airFuelRatio - 14.7) * 5))
        );
        
        return {
            power: Math.max(0, power),
            torque: Math.max(0, torque),
            efficiency: Math.max(0, Math.min(efficiency, 45)),
            temperature: Math.max(160, Math.min(temperature, 250))
        };
    }
    
    calculateRPMFactor(rpm) {
        const optimalRPM = 4000;
        const factor = 1 - Math.pow((rpm - optimalRPM) / 4000, 2);
        return Math.max(0.1, Math.min(1, factor));
    }
    
    calculateAFRFactor(afr) {
        const optimal = 14.7;
        const deviation = Math.abs(afr - optimal);
        return Math.max(0.3, 1 - (deviation * 0.1));
    }
    
    calculateTimingFactor(timing) {
        const optimal = 15;
        const deviation = Math.abs(timing - optimal);
        return Math.max(0.5, 1 - (deviation * 0.02));
    }
}