import { BaseEngine2D } from './BaseEngine2D.js';

export class V6Engine2D extends BaseEngine2D {
    constructor(sideCtx, topCtx) {
        super(sideCtx, topCtx);
        
        this.cylinderCount = 6;
        this.vAngle = 60;
        this.cylinderSpacing = 70;
        this.crankRadius = 50;
        this.rodLength = 160;
        this.pistonHeight = 25;
        this.cylinderHeight = 180;
        
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
        const firingOrder = this.getFiringOrder();
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const firingOffset = firingOrder.indexOf(i) * 120;
            const cylinderCrankAngle = crankAngle + firingOffset;
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
        const maxLift = 12;
        
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
        const crankCenterY = baseY + 120;
        
        this.drawEngineBlock(this.sideCtx, center.x, baseY);
        this.drawCrankshaft(this.sideCtx, center.x, crankCenterY);
        this.drawCamshafts(this.sideCtx, center.x, baseY - this.cylinderHeight - 50);
        
        for (let i = 0; i < 3; i++) {
            const x = center.x + (i - 1) * this.cylinderSpacing;
            
            const leftCylIndex = i;
            const rightCylIndex = i + 3;
            
            this.drawCylinderBank(this.sideCtx, x, baseY, 'left', leftCylIndex);
            this.drawCylinderBank(this.sideCtx, x, baseY, 'right', rightCylIndex);
            this.drawPistonBank(this.sideCtx, x, baseY, 'left', leftCylIndex);
            this.drawPistonBank(this.sideCtx, x, baseY, 'right', rightCylIndex);
            this.drawValvesBank(this.sideCtx, x, baseY, 'left', leftCylIndex);
            this.drawValvesBank(this.sideCtx, x, baseY, 'right', rightCylIndex);
            
            this.drawCombustion(this.sideCtx, x - 25, baseY - 70, this.combustionIntensities[leftCylIndex]);
            this.drawCombustion(this.sideCtx, x + 25, baseY - 70, this.combustionIntensities[rightCylIndex]);
            
            if (this.labelsVisible) {
                this.drawLabel(this.sideCtx, `L${i + 1}`, x - 25, baseY - 120);
                this.drawLabel(this.sideCtx, `R${i + 1}`, x + 25, baseY - 120);
            }
        }
        
        if (this.labelsVisible) {
            this.drawLabel(this.sideCtx, 'V6 Crankshaft', center.x, crankCenterY + 50);
        }
    }
    
    renderTopView() {
        const center = this.getCanvasCenter(this.topCtx);
        
        this.drawEngineBlockTop(this.topCtx, center.x, center.y);
        
        for (let i = 0; i < 3; i++) {
            const x = center.x + (i - 1) * this.cylinderSpacing;
            
            const leftCylIndex = i;
            const rightCylIndex = i + 3;
            
            this.drawCylinderTop(this.topCtx, x, center.y - 40, leftCylIndex, 'left');
            this.drawCylinderTop(this.topCtx, x, center.y + 40, rightCylIndex, 'right');
            this.drawValvesTop(this.topCtx, x, center.y - 40, leftCylIndex);
            this.drawValvesTop(this.topCtx, x, center.y + 40, rightCylIndex);
            
            this.drawCombustion(this.topCtx, x, center.y - 40, this.combustionIntensities[leftCylIndex]);
            this.drawCombustion(this.topCtx, x, center.y + 40, this.combustionIntensities[rightCylIndex]);
            
            if (this.labelsVisible) {
                this.drawLabel(this.topCtx, `L${i + 1}`, x, center.y - 60);
                this.drawLabel(this.topCtx, `R${i + 1}`, x, center.y + 60);
            }
        }
        
        if (this.labelsVisible) {
            this.drawLabel(this.topCtx, 'V6 Engine - Top View', center.x, center.y - 120);
        }
    }
    
    drawEngineBlock(ctx, centerX, centerY) {
        const blockWidth = this.cylinderSpacing * 3;
        const blockHeight = 160;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.iron;
        
        const vAngleRad = (this.vAngle * Math.PI) / 180 / 2;
        const bankOffset = 40;
        
        ctx.save();
        ctx.translate(centerX - bankOffset, centerY);
        ctx.rotate(-vAngleRad);
        this.drawRect(ctx, 0, 0, blockWidth, blockHeight / 2, color, true);
        ctx.restore();
        
        ctx.save();
        ctx.translate(centerX + bankOffset, centerY);
        ctx.rotate(vAngleRad);
        this.drawRect(ctx, 0, 0, blockWidth, blockHeight / 2, color, true);
        ctx.restore();
        
        const crankCaseHeight = 100;
        this.drawRect(ctx, centerX, centerY + 130, blockWidth, crankCaseHeight, color, true);
    }
    
    drawEngineBlockTop(ctx, centerX, centerY) {
        const blockWidth = this.cylinderSpacing * 3;
        const blockDepth = 60;
        const vAngleRad = (this.vAngle * Math.PI) / 180 / 2;
        const bankOffset = 40;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.iron;
        
        this.drawRect(ctx, centerX, centerY - bankOffset, blockWidth, blockDepth, color, true);
        this.drawRect(ctx, centerX, centerY + bankOffset, blockWidth, blockDepth, color, true);
    }
    
    drawCylinderBank(ctx, x, baseY, side, cylinderIndex) {
        const vAngleRad = (this.vAngle * Math.PI) / 180 / 2;
        const bankOffset = side === 'left' ? -30 : 30;
        const rotation = side === 'left' ? -vAngleRad : vAngleRad;
        
        ctx.save();
        ctx.translate(x + bankOffset, baseY);
        ctx.rotate(rotation);
        
        const cylinderWidth = 40;
        const cylinderY = -this.cylinderHeight / 2;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.steel;
        this.drawRect(ctx, 0, cylinderY, cylinderWidth, this.cylinderHeight, color, true);
        
        const headHeight = 35;
        const headY = -this.cylinderHeight - headHeight / 2;
        this.drawRect(ctx, 0, headY, cylinderWidth + 15, headHeight, this.colors.aluminum, true);
        
        ctx.restore();
    }
    
    drawCylinderTop(ctx, x, y, cylinderIndex, side) {
        const cylinderRadius = 20;
        
        const color = this.cutawayMode ? this.colors.cutaway : this.colors.steel;
        this.drawCircle(ctx, x, y, cylinderRadius, color, true);
    }
    
    drawPistonBank(ctx, x, baseY, side, cylinderIndex) {
        const vAngleRad = (this.vAngle * Math.PI) / 180 / 2;
        const bankOffset = side === 'left' ? -30 : 30;
        const rotation = side === 'left' ? -vAngleRad : vAngleRad;
        
        ctx.save();
        ctx.translate(x + bankOffset, baseY);
        ctx.rotate(rotation);
        
        const pistonY = -this.pistonPositions[cylinderIndex];
        const pistonWidth = 35;
        
        this.drawRect(ctx, 0, pistonY, pistonWidth, this.pistonHeight, this.colors.piston, true);
        
        ctx.restore();
        
        const crankY = baseY + 120;
        const crankAngleRad = (this.crankAngle * Math.PI) / 180;
        const throwAngle = crankAngleRad + (cylinderIndex % 3) * (120 * Math.PI / 180);
        const crankX = x + this.crankRadius * Math.cos(throwAngle + Math.PI / 2);
        const crankPinY = crankY + this.crankRadius * Math.sin(throwAngle + Math.PI / 2);
        
        const pistonX = x + bankOffset + Math.cos(rotation) * (-this.pistonPositions[cylinderIndex]);
        const pistonWorldY = baseY + Math.sin(rotation) * (-this.pistonPositions[cylinderIndex]);
        
        this.drawConnectingRod(ctx, pistonX, pistonWorldY, crankX, crankPinY, this.colors.steel);
    }
    
    drawCrankshaft(ctx, centerX, centerY) {
        const crankWidth = this.cylinderSpacing * 2.5;
        this.drawRect(ctx, centerX, centerY, crankWidth, 30, this.colors.crankshaft, true);
        
        for (let i = 0; i < 3; i++) {
            const x = centerX + (i - 1) * this.cylinderSpacing;
            const crankAngleRad = (this.crankAngle * Math.PI) / 180;
            const throwAngle = crankAngleRad + i * (120 * Math.PI / 180);
            
            const throwX = x + this.crankRadius * Math.cos(throwAngle + Math.PI / 2);
            const throwY = centerY + this.crankRadius * Math.sin(throwAngle + Math.PI / 2);
            
            this.drawLine(ctx, x, centerY, throwX, throwY, this.colors.steel, 10);
            this.drawCircle(ctx, throwX, throwY, 15, this.colors.steel, true);
        }
    }
    
    drawCamshafts(ctx, centerX, centerY) {
        const camWidth = this.cylinderSpacing * 2.5;
        const bankOffset = 30;
        
        this.drawRect(ctx, centerX - bankOffset, centerY, camWidth, 12, this.colors.steel, true);
        this.drawRect(ctx, centerX + bankOffset, centerY, camWidth, 12, this.colors.steel, true);
        
        for (let i = 0; i < 3; i++) {
            const x = centerX + (i - 1) * this.cylinderSpacing;
            
            this.drawCircle(ctx, x - bankOffset - 10, centerY, 18, this.colors.steel, true);
            this.drawCircle(ctx, x - bankOffset + 10, centerY, 18, this.colors.steel, true);
            this.drawCircle(ctx, x + bankOffset - 10, centerY, 18, this.colors.steel, true);
            this.drawCircle(ctx, x + bankOffset + 10, centerY, 18, this.colors.steel, true);
        }
    }
    
    drawValvesBank(ctx, x, baseY, side, cylinderIndex) {
        const vAngleRad = (this.vAngle * Math.PI) / 180 / 2;
        const bankOffset = side === 'left' ? -30 : 30;
        const rotation = side === 'left' ? -vAngleRad : vAngleRad;
        
        const valveHeadY = baseY - this.cylinderHeight - 20;
        const intakeOffset = -12;
        const exhaustOffset = 12;
        
        const intakeLift = this.valvePositions[cylinderIndex].intake;
        const exhaustLift = this.valvePositions[cylinderIndex].exhaust;
        
        ctx.save();
        ctx.translate(x + bankOffset, valveHeadY);
        ctx.rotate(rotation);
        
        this.drawLine(ctx, intakeOffset, -intakeLift, intakeOffset, 35 - intakeLift, this.colors.valve, 3);
        this.drawCircle(ctx, intakeOffset, 35 - intakeLift, 6, this.colors.valve);
        
        this.drawLine(ctx, exhaustOffset, -exhaustLift, exhaustOffset, 35 - exhaustLift, this.colors.exhaust, 3);
        this.drawCircle(ctx, exhaustOffset, 35 - exhaustLift, 6, this.colors.exhaust);
        
        ctx.restore();
    }
    
    drawValvesTop(ctx, x, y, cylinderIndex) {
        const intakeValveX = x - 12;
        const exhaustValveX = x + 12;
        
        const intakeLift = this.valvePositions[cylinderIndex].intake;
        const exhaustLift = this.valvePositions[cylinderIndex].exhaust;
        
        const intakeRadius = 5 + intakeLift * 0.2;
        const exhaustRadius = 5 + exhaustLift * 0.2;
        
        this.drawCircle(ctx, intakeValveX, y, intakeRadius, this.colors.valve, true);
        this.drawCircle(ctx, exhaustValveX, y, exhaustRadius, this.colors.exhaust, true);
    }
    
    getFiringOrder() {
        return [1, 4, 2, 5, 3, 6];
    }
    
    setCamshaftConfig(config) {
        this.camshaftConfig = config;
    }
}