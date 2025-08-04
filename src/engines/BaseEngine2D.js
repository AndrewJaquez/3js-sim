export class BaseEngine2D {
    constructor(sideCtx, topCtx) {
        this.sideCtx = sideCtx;
        this.topCtx = topCtx;
        
        this.settings = {
            rpm: 800,
            throttle: 25,
            airFuelRatio: 14.7,
            ignitionTiming: 15,
            boost: 0
        };
        
        this.time = 0;
        this.crankAngle = 0;
        this.cutawayMode = false;
        this.labelsVisible = true;
        
        this.colors = this.createColors();
        this.initializeComponents();
    }
    
    createColors() {
        return {
            steel: '#888888',
            aluminum: '#AAAAAA',
            iron: '#333333',
            plastic: '#222222',
            copper: '#B87333',
            exhaust: '#444444',
            combustion: '#FF4400',
            combustionGlow: '#FF2200',
            cutaway: 'rgba(255, 255, 255, 0.3)',
            crankshaft: '#666666',
            piston: '#CCCCCC',
            valve: '#777777',
            sparkPlug: '#FFAA00',
            labels: '#00FF00',
            grid: '#222222',
            centerline: '#444444'
        };
    }
    
    initializeComponents() {
        throw new Error('initializeComponents must be implemented by subclass');
    }
    
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
    
    setCutawayMode(enabled) {
        this.cutawayMode = enabled;
    }
    
    setLabelsVisible(visible) {
        this.labelsVisible = visible;
    }
    
    calculateCrankAngle(deltaTime) {
        const rps = this.settings.rpm / 60;
        const anglePerSecond = rps * 360;
        this.crankAngle += anglePerSecond * deltaTime;
        this.crankAngle %= 360;
        return this.crankAngle;
    }
    
    calculatePistonPosition(crankAngle, rodLength = 150, crankRadius = 45) {
        const crankRad = (crankAngle * Math.PI) / 180;
        const cosA = Math.cos(crankRad);
        const sinA = Math.sin(crankRad);
        
        const beta = Math.asin((crankRadius * sinA) / rodLength);
        const pistonPosition = crankRadius * cosA + rodLength * Math.cos(beta);
        
        return pistonPosition;
    }
    
    getCombustionIntensity(cylinderIndex, crankAngle) {
        const firingOrder = this.getFiringOrder();
        const cylinderOffset = (firingOrder.indexOf(cylinderIndex) * (720 / firingOrder.length)) % 720;
        const adjustedAngle = (crankAngle * 2 + cylinderOffset) % 720;
        
        const ignitionStart = 720 - this.settings.ignitionTiming;
        const combustionDuration = 60;
        
        if (adjustedAngle >= ignitionStart && adjustedAngle <= ignitionStart + combustionDuration) {
            const progress = (adjustedAngle - ignitionStart) / combustionDuration;
            const intensity = Math.sin(progress * Math.PI) * this.settings.throttle / 100;
            return Math.max(0, intensity);
        }
        
        return 0;
    }
    
    getFiringOrder() {
        return [1, 3, 4, 2];
    }
    
    drawRect(ctx, x, y, width, height, color, stroke = false) {
        ctx.fillStyle = color;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        if (stroke) {
            ctx.strokeStyle = this.colors.steel;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - width/2, y - height/2, width, height);
        }
    }
    
    drawCircle(ctx, x, y, radius, color, stroke = false) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        if (stroke) {
            ctx.strokeStyle = this.colors.steel;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    drawLine(ctx, x1, y1, x2, y2, color, width = 2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }
    
    drawConnectingRod(ctx, x1, y1, x2, y2, color) {
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);
        
        ctx.fillStyle = color;
        ctx.fillRect(0, -8, length, 16);
        
        ctx.fillStyle = this.colors.steel;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(length, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawCombustion(ctx, x, y, intensity) {
        if (intensity <= 0) return;
        
        const maxRadius = 40;
        const radius = 15 + intensity * maxRadius;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 68, 0, ${intensity * 0.9})`);
        gradient.addColorStop(0.5, `rgba(255, 34, 0, ${intensity * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 68, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawLabel(ctx, text, x, y) {
        if (!this.labelsVisible) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 2, y - 16, text.length * 7 + 4, 20);
        
        ctx.fillStyle = this.colors.labels;
        ctx.font = '12px Arial';
        ctx.fillText(text, x, y);
    }
    
    getCanvasCenter(ctx) {
        return {
            x: ctx.canvas.width / 2,
            y: ctx.canvas.height / 2
        };
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.calculateCrankAngle(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateAnimation(deltaTime) {
        // Override in subclasses
    }
    
    render() {
        this.renderSideView();
        this.renderTopView();
    }
    
    renderSideView() {
        // Override in subclasses
    }
    
    renderTopView() {
        // Override in subclasses
    }
    
    dispose() {
        // Cleanup if needed
    }
}