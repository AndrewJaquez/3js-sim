export class Turbocharger2D {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = false;
        this.turbineSpeed = 0;
        this.compressorSpeed = 0;
        this.boostPressure = 0;
        this.temperature = 0;
        
        this.colors = {
            housing: '#444444',
            turbine: '#FF6600',
            compressor: '#0066FF',
            shaft: '#888888',
            inlet: '#AAAAAA',
            outlet: '#CCCCCC',
            exhaust: '#FF3300',
            labels: '#00FF00'
        };
    }
    
    update(deltaTime, settings) {
        if (!this.enabled) {
            this.turbineSpeed *= 0.95;
            this.compressorSpeed *= 0.95;
            this.boostPressure *= 0.9;
            return;
        }
        
        const exhaustFlow = (settings.rpm / 8000) * (settings.throttle / 100);
        const targetTurbineSpeed = exhaustFlow * 200000; // RPM
        
        this.turbineSpeed += (targetTurbineSpeed - this.turbineSpeed) * deltaTime * 5;
        this.compressorSpeed = this.turbineSpeed * 0.98; // Slight efficiency loss
        
        this.boostPressure = Math.min(30, (this.compressorSpeed / 100000) * settings.throttle / 100 * 15);
        this.temperature = 70 + (this.turbineSpeed / 1000) + (settings.throttle * 2);
    }
    
    render() {
        if (!this.ctx || !this.ctx.canvas) return;
        
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.ctx.clearRect(0, 0, width, height);
        this.drawGrid();
        
        if (this.enabled) {
            this.drawTurbocharger(centerX, centerY);
            this.drawAirflow(centerX, centerY);
            this.drawLabels(centerX, centerY);
        } else {
            this.drawDisabledState(centerX, centerY);
        }
        
        this.drawStats(20, 30);
    }
    
    drawGrid() {
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        
        const gridSize = 30;
        
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    drawTurbocharger(centerX, centerY) {
        // Main housing
        this.ctx.fillStyle = this.colors.housing;
        this.ctx.fillRect(centerX - 60, centerY - 30, 120, 60);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 60, centerY - 30, 120, 60);
        
        // Turbine side (right - hot)
        const turbineAngle = (this.turbineSpeed / 1000) % 360;
        this.drawTurbineWheel(centerX + 30, centerY, turbineAngle, this.colors.turbine);
        
        // Compressor side (left - cold)
        const compressorAngle = (this.compressorSpeed / 1000) % 360;
        this.drawCompressorWheel(centerX - 30, centerY, compressorAngle, this.colors.compressor);
        
        // Central shaft
        this.ctx.strokeStyle = this.colors.shaft;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 30, centerY);
        this.ctx.lineTo(centerX + 30, centerY);
        this.ctx.stroke();
        
        // Bearing housing in center
        this.ctx.fillStyle = '#666';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Intake and exhaust ports
        this.drawIntakePort(centerX - 80, centerY);
        this.drawExhaustPort(centerX + 80, centerY);
    }
    
    drawTurbineWheel(x, y, angle, color) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((angle * Math.PI) / 180);
        
        // Turbine blades
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Blade pattern
        this.ctx.strokeStyle = '#FF9900';
        this.ctx.lineWidth = 2;
        const bladeCount = 12;
        for (let i = 0; i < bladeCount; i++) {
            const bladeAngle = (i * 360) / bladeCount;
            const rad = (bladeAngle * Math.PI) / 180;
            this.ctx.beginPath();
            this.ctx.moveTo(5 * Math.cos(rad), 5 * Math.sin(rad));
            this.ctx.lineTo(18 * Math.cos(rad), 18 * Math.sin(rad));
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawCompressorWheel(x, y, angle, color) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((angle * Math.PI) / 180);
        
        // Compressor impeller
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Impeller vanes (curved)
        this.ctx.strokeStyle = '#0099FF';
        this.ctx.lineWidth = 2;
        const vaneCount = 8;
        for (let i = 0; i < vaneCount; i++) {
            const vaneAngle = (i * 360) / vaneCount;
            const rad = (vaneAngle * Math.PI) / 180;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, rad - 0.3, rad + 0.3);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawIntakePort(x, y) {
        // Intake (cold air in)
        this.ctx.fillStyle = this.colors.inlet;
        this.ctx.fillRect(x - 10, y - 15, 20, 30);
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 10, y - 15, 20, 30);
        
        // Air filter representation
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x - 15, y - 10, 10, 20);
    }
    
    drawExhaustPort(x, y) {
        // Exhaust (hot gas in)
        this.ctx.fillStyle = this.colors.exhaust;
        this.ctx.fillRect(x - 10, y - 15, 20, 30);
        this.ctx.strokeStyle = '#AA0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 10, y - 15, 20, 30);
    }
    
    drawAirflow(centerX, centerY) {
        if (this.turbineSpeed < 1000) return;
        
        const time = Date.now() / 1000;
        const flowSpeed = this.turbineSpeed / 50000;
        
        // Intake airflow
        for (let i = 0; i < 5; i++) {
            const offset = (time * flowSpeed + i * 0.5) % 2;
            const x = centerX - 120 + offset * 40;
            const y = centerY + (Math.sin(time * 3 + i) * 5);
            
            this.ctx.fillStyle = `rgba(0, 150, 255, ${0.7 - offset * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Exhaust flow
        for (let i = 0; i < 3; i++) {
            const offset = (time * flowSpeed * 1.5 + i * 0.7) % 1.5;
            const x = centerX + 90 + offset * 30;
            const y = centerY + (Math.sin(time * 4 + i) * 8);
            
            this.ctx.fillStyle = `rgba(255, 100, 0, ${0.8 - offset * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Boost air output (top)
        for (let i = 0; i < 4; i++) {
            const offset = (time * flowSpeed * 2 + i * 0.4) % 1.5;
            const x = centerX - 30 + (Math.sin(time * 2 + i) * 10);
            const y = centerY - 60 - offset * 20;
            
            this.ctx.fillStyle = `rgba(100, 255, 100, ${0.9 - offset * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawLabels(centerX, centerY) {
        this.ctx.fillStyle = this.colors.labels;
        this.ctx.font = '10px Arial';
        
        this.ctx.fillText('Compressor', centerX - 60, centerY - 40);
        this.ctx.fillText('Turbine', centerX + 20, centerY - 40);
        this.ctx.fillText('Cold Air In', centerX - 140, centerY - 25);
        this.ctx.fillText('Hot Exhaust In', centerX + 90, centerY - 25);
        this.ctx.fillText('Boost Out', centerX - 40, centerY - 80);
    }
    
    drawDisabledState(centerX, centerY) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(centerX - 60, centerY - 30, 120, 60);
        this.ctx.strokeStyle = '#555';
        this.ctx.strokeRect(centerX - 60, centerY - 30, 120, 60);
        
        this.ctx.fillStyle = '#666';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Turbocharger', centerX, centerY - 5);
        this.ctx.fillText('Disabled', centerX, centerY + 10);
        this.ctx.textAlign = 'left';
    }
    
    drawStats(x, y) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x - 5, y - 15, 160, 80);
        
        this.ctx.fillStyle = this.colors.labels;
        this.ctx.font = '11px Arial';
        
        this.ctx.fillText(`Turbine: ${Math.round(this.turbineSpeed).toLocaleString()} RPM`, x, y);
        this.ctx.fillText(`Compressor: ${Math.round(this.compressorSpeed).toLocaleString()} RPM`, x, y + 15);
        this.ctx.fillText(`Boost: ${this.boostPressure.toFixed(1)} PSI`, x, y + 30);
        this.ctx.fillText(`Temp: ${Math.round(this.temperature)}°F`, x, y + 45);
        this.ctx.fillText(`Status: ${this.enabled ? 'ACTIVE' : 'DISABLED'}`, x, y + 60);
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    getBoostPressure() {
        return this.enabled ? this.boostPressure : 0;
    }
}