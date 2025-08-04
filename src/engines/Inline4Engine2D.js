import { BaseEngine2D } from './BaseEngine2D.js';

export class Inline4Engine2D extends BaseEngine2D {
    constructor(sideCtx, topCtx) {
        super(sideCtx, topCtx);
        
        this.cylinderCount = 4;
        this.cylinderSpacing = 80;
        this.crankRadius = 45;
        this.rodLength = 150;
        this.pistonHeight = 30;
        this.cylinderHeight = 200;
        
        this.pistonPositions = [];
        this.valvePositions = [];
        this.combustionIntensities = [];
        this.camshaftConfig = 'dohc';
        
        this.setupEngine();
    }
    
    initializeComponents() {
        for (let i = 0; i < this.cylinderCount; i++) {
            this.pistonPositions.push(0);
            this.valvePositions.push({ intake: 0, exhaust: 0 });
            this.combustionIntensities.push(0);
        }
    }
    
    setupEngine() {
        this.initializeComponents();
    }
    
    updateAnimation(deltaTime) {
        const crankAngle = this.crankAngle;
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const cylinderCrankAngle = crankAngle + (i % 2) * 180;
            this.updatePiston(i, cylinderCrankAngle);
            this.updateValves(i, cylinderCrankAngle);
            this.updateCombustion(i, cylinderCrankAngle);
        }
    }
    
    updatePiston(cylinderIndex, crankAngle) {
        const pistonPosition = this.calculatePistonPosition(crankAngle);
        this.pistonPositions[cylinderIndex] = pistonPosition;
    }
    
    updateValves(cylinderIndex, crankAngle) {
        const intakeLift = this.getValveLift('intake', crankAngle);
        const exhaustLift = this.getValveLift('exhaust', crankAngle);
        
        this.valvePositions[cylinderIndex] = {
            intake: intakeLift,
            exhaust: exhaustLift
        };
    }
    
    getValveLift(valveType, crankAngle) {
        const camAngle = (crankAngle / 2) % 360;
        const maxLift = 15;
        
        if (valveType === 'intake') {
            const openAngle = 350;
            const closeAngle = 110;
            
            if (camAngle >= openAngle || camAngle <= closeAngle) {
                const adjustedAngle = camAngle >= openAngle ? camAngle - 360 : camAngle;
                const duration = (closeAngle - (openAngle - 360));
                const progress = (adjustedAngle - (openAngle - 360)) / duration;
                
                if (progress >= 0 && progress <= 1) {
                    return maxLift * Math.sin(progress * Math.PI);
                }
            }
        } else if (valveType === 'exhaust') {
            const openAngle = 130;
            const closeAngle = 350;
            
            if (camAngle >= openAngle && camAngle <= closeAngle) {
                const duration = closeAngle - openAngle;
                const progress = (camAngle - openAngle) / duration;
                return maxLift * Math.sin(progress * Math.PI);
            }
        }
        
        return 0;
    }
    
    updateCombustion(cylinderIndex, crankAngle) {
        this.combustionIntensities[cylinderIndex] = this.getCombustionIntensity(cylinderIndex, crankAngle);
    }
    
    renderSideView() {
        const center = this.getCanvasCenter(this.sideCtx);
        const baseY = center.y;
        const crankCenterY = baseY + 100;
        
        this.drawEngineBlock(this.sideCtx, center.x, baseY);
        this.drawCrankshaft(this.sideCtx, center.x, crankCenterY);
        this.drawCamshaft(this.sideCtx, center.x, baseY - this.cylinderHeight - 40);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = center.x + (i - 1.5) * this.cylinderSpacing;
            this.drawCylinder(this.sideCtx, x, baseY, i);
            this.drawPiston(this.sideCtx, x, baseY, i);
            this.drawValves(this.sideCtx, x, baseY, i);
            this.drawCombustion(this.sideCtx, x, baseY - 60, this.combustionIntensities[i]);
            
            if (this.labelsVisible) {
                this.drawLabel(this.sideCtx, `Cyl ${i + 1}`, x, baseY - 140);
            }
        }
        
        if (this.labelsVisible) {
            this.drawLabel(this.sideCtx, 'Crankshaft', center.x, crankCenterY + 40);
            const camshaftLabel = this.camshaftConfig === 'sohc' ? 'SOHC Camshaft' : 'DOHC Camshafts';
            this.drawLabel(this.sideCtx, camshaftLabel, center.x, baseY - this.cylinderHeight - 60);
        }
    }
    
    renderTopView() {
        const center = this.getCanvasCenter(this.topCtx);
        
        this.drawEngineBlockTop(this.topCtx, center.x, center.y);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = center.x + (i - 1.5) * this.cylinderSpacing;
            this.drawCylinderTop(this.topCtx, x, center.y, i);
            this.drawValvesTop(this.topCtx, x, center.y, i);
            this.drawCombustion(this.topCtx, x, center.y, this.combustionIntensities[i]);
            
            if (this.labelsVisible) {
                this.drawLabel(this.topCtx, `${i + 1}`, x, center.y + 40);
            }
        }
        
        if (this.labelsVisible) {
            this.drawLabel(this.topCtx, 'Inline 4 - Top View', center.x, center.y - 100);
        }
    }
    
    drawEngineBlock(ctx, centerX, centerY) {
        const blockWidth = this.cylinderSpacing * 4;
        const blockHeight = 150;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.iron;
        this.drawRect(ctx, centerX, centerY, blockWidth, blockHeight, color, true);
        
        const crankCaseHeight = 80;
        this.drawRect(ctx, centerX, centerY + 115, blockWidth, crankCaseHeight, color, true);
    }
    
    drawEngineBlockTop(ctx, centerX, centerY) {
        const blockWidth = this.cylinderSpacing * 4;
        const blockDepth = 120;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.iron;
        this.drawRect(ctx, centerX, centerY, blockWidth, blockDepth, color, true);
    }
    
    drawCylinder(ctx, x, baseY, cylinderIndex) {
        const cylinderWidth = 50;
        const cylinderY = baseY - this.cylinderHeight / 2;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.steel;
        this.drawRect(ctx, x, cylinderY, cylinderWidth, this.cylinderHeight, color, true);
        
        const headHeight = 40;
        const headY = baseY - this.cylinderHeight - headHeight / 2;
        this.drawRect(ctx, x, headY, cylinderWidth + 20, headHeight, this.colors.aluminum, true);
    }
    
    drawCylinderTop(ctx, x, y, cylinderIndex) {
        const cylinderRadius = 25;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.steel;
        this.drawCircle(ctx, x, y, cylinderRadius, color, true);
    }
    
    drawPiston(ctx, x, baseY, cylinderIndex) {
        const pistonY = baseY - this.pistonPositions[cylinderIndex];
        const pistonWidth = 45;
        
        this.drawRect(ctx, x, pistonY, pistonWidth, this.pistonHeight, this.colors.piston, true);
        
        const crankY = baseY + 100;
        const crankAngleRad = (this.crankAngle * Math.PI) / 180;
        const crankX = x + this.crankRadius * Math.cos(crankAngleRad + Math.PI / 2);
        const crankPinY = crankY + this.crankRadius * Math.sin(crankAngleRad + Math.PI / 2);
        
        this.drawConnectingRod(ctx, x, pistonY + this.pistonHeight / 2, crankX, crankPinY, this.colors.steel);
    }
    
    drawCrankshaft(ctx, centerX, centerY) {
        const crankWidth = this.cylinderSpacing * 3.5;
        this.drawRect(ctx, centerX, centerY, crankWidth, 25, this.colors.crankshaft, true);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = centerX + (i - 1.5) * this.cylinderSpacing;
            const crankAngleRad = (this.crankAngle * Math.PI) / 180;
            const throwAngle = crankAngleRad + (i % 2) * Math.PI;
            
            const throwX = x + this.crankRadius * Math.cos(throwAngle + Math.PI / 2);
            const throwY = centerY + this.crankRadius * Math.sin(throwAngle + Math.PI / 2);
            
            this.drawLine(ctx, x, centerY, throwX, throwY, this.colors.steel, 8);
            this.drawCircle(ctx, throwX, throwY, 12, this.colors.steel, true);
        }
    }
    
    drawCamshaft(ctx, centerX, centerY) {
        if (this.camshaftConfig === 'sohc') {
            // Single overhead cam
            const camWidth = this.cylinderSpacing * 3.5;
            this.drawRect(ctx, centerX, centerY, camWidth, 15, this.colors.steel, true);
            
            for (let i = 0; i < this.cylinderCount; i++) {
                const x = centerX + (i - 1.5) * this.cylinderSpacing;
                
                // Single cam lobe per cylinder (operates both valves via rockers)
                this.drawCircle(ctx, x, centerY, 20, this.colors.steel, true);
            }
        } else {
            // Dual overhead cam (DOHC)
            const camWidth = this.cylinderSpacing * 3.5;
            const intakeCamY = centerY - 15;
            const exhaustCamY = centerY + 15;
            
            // Intake camshaft
            this.drawRect(ctx, centerX, intakeCamY, camWidth, 12, this.colors.aluminum, true);
            // Exhaust camshaft
            this.drawRect(ctx, centerX, exhaustCamY, camWidth, 12, this.colors.exhaust, true);
            
            for (let i = 0; i < this.cylinderCount; i++) {
                const x = centerX + (i - 1.5) * this.cylinderSpacing;
                
                // Intake cam lobes
                this.drawCircle(ctx, x, intakeCamY, 18, this.colors.aluminum, true);
                // Exhaust cam lobes
                this.drawCircle(ctx, x, exhaustCamY, 18, this.colors.exhaust, true);
            }
        }
    }
    
    drawValves(ctx, x, baseY, cylinderIndex) {
        const valveHeadY = baseY - this.cylinderHeight - 20;
        const intakeValveX = x - 15;
        const exhaustValveX = x + 15;
        
        const intakeLift = this.valvePositions[cylinderIndex].intake;
        const exhaustLift = this.valvePositions[cylinderIndex].exhaust;
        
        this.drawLine(ctx, intakeValveX, valveHeadY - intakeLift, intakeValveX, valveHeadY + 40 - intakeLift, this.colors.valve, 4);
        this.drawCircle(ctx, intakeValveX, valveHeadY + 40 - intakeLift, 8, this.colors.valve);
        
        this.drawLine(ctx, exhaustValveX, valveHeadY - exhaustLift, exhaustValveX, valveHeadY + 40 - exhaustLift, this.colors.exhaust, 4);
        this.drawCircle(ctx, exhaustValveX, valveHeadY + 40 - exhaustLift, 8, this.colors.exhaust);
    }
    
    drawValvesTop(ctx, x, y, cylinderIndex) {
        const intakeValveX = x - 15;
        const exhaustValveX = x + 15;
        
        const intakeLift = this.valvePositions[cylinderIndex].intake;
        const exhaustLift = this.valvePositions[cylinderIndex].exhaust;
        
        const intakeRadius = 6 + intakeLift * 0.3;
        const exhaustRadius = 6 + exhaustLift * 0.3;
        
        this.drawCircle(ctx, intakeValveX, y, intakeRadius, this.colors.valve, true);
        this.drawCircle(ctx, exhaustValveX, y, exhaustRadius, this.colors.exhaust, true);
    }
    
    getFiringOrder() {
        return [1, 3, 4, 2];
    }
    
    setCamshaftConfig(config) {
        this.camshaftConfig = config;
    }
}