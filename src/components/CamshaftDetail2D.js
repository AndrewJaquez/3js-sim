export class CamshaftDetail2D {
    constructor(ctx) {
        this.ctx = ctx;
        this.visible = true;
        this.configuration = 'dohc'; // 'sohc' or 'dohc'
        this.camAngle = 0;
        
        this.colors = {
            shaft: '#888888',
            cam: '#AAAAAA',
            intakeCam: '#00AA00',
            exhaustCam: '#AA0000',
            valve: '#666666',
            intakeValve: '#0066FF',
            exhaustValve: '#FF6600',
            spring: '#FFAA00',
            labels: '#00FF00',
            timing: '#FF00FF'
        };
        
        this.cylinderCount = 4;
        this.camLobes = [];
        this.initializeCamLobes();
    }
    
    initializeCamLobes() {
        this.camLobes = [];
        for (let i = 0; i < this.cylinderCount; i++) {
            this.camLobes.push({
                intakePhase: (i % 2) * 180, // Firing order timing
                exhaustPhase: (i % 2) * 180 + 360,
                intakeLift: 0,
                exhaustLift: 0
            });
        }
    }
    
    update(deltaTime, crankAngle, settings) {
        this.camAngle = (crankAngle / 2) % 360; // Camshaft runs at half crankshaft speed
        
        // Update valve lifts for each cylinder
        for (let i = 0; i < this.cylinderCount; i++) {
            const lobe = this.camLobes[i];
            
            // Calculate intake valve lift
            const intakeAngle = (this.camAngle + lobe.intakePhase) % 360;
            lobe.intakeLift = this.calculateValveLift(intakeAngle, 'intake');
            
            // Calculate exhaust valve lift
            const exhaustAngle = (this.camAngle + lobe.exhaustPhase) % 360;
            lobe.exhaustLift = this.calculateValveLift(exhaustAngle, 'exhaust');
        }
    }
    
    calculateValveLift(camAngle, valveType) {
        const maxLift = 12;
        
        if (valveType === 'intake') {
            // Intake valve timing: opens 10° BTDC, closes 50° ABDC
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
            // Exhaust valve timing: opens 50° BBDC, closes 10° ATDC
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
    
    render() {
        if (!this.visible || !this.ctx || !this.ctx.canvas) return;
        
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        
        this.ctx.clearRect(0, 0, width, height);
        this.drawGrid();
        
        if (this.configuration === 'sohc') {
            this.renderSOHC();
        } else {
            this.renderDOHC();
        }
        
        this.drawTimingInfo();
    }
    
    drawGrid() {
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        
        const gridSize = 25;
        
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
    
    renderSOHC() {
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        const centerY = height / 2;
        const camY = centerY - 60;
        const valveY = centerY + 60;
        
        // Single camshaft
        this.drawCamshaft(20, camY, width - 40, 'single');
        
        // Cylinders and valves
        const cylinderSpacing = (width - 80) / this.cylinderCount;
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = 40 + i * cylinderSpacing + cylinderSpacing / 2;
            const lobe = this.camLobes[i];
            
            // Rocker arms (SOHC uses rockers)
            this.drawRockerArm(x - 15, camY + 30, lobe.intakeLift, 'intake');
            this.drawRockerArm(x + 15, camY + 30, lobe.exhaustLift, 'exhaust');
            
            // Valves
            this.drawValve(x - 15, valveY, lobe.intakeLift, 'intake');
            this.drawValve(x + 15, valveY, lobe.exhaustLift, 'exhaust');
            
            // Cam lobes
            this.drawCamLobe(x - 15, camY, lobe.intakeLift, 'intake');
            this.drawCamLobe(x + 15, camY, lobe.exhaustLift, 'exhaust');
            
            // Cylinder number
            this.ctx.fillStyle = this.colors.labels;
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${i + 1}`, x, valveY + 40);
        }
        
        this.ctx.fillStyle = this.colors.labels;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SOHC Configuration', 10, 20);
    }
    
    renderDOHC() {
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        const centerY = height / 2;
        const intakeCamY = centerY - 80;
        const exhaustCamY = centerY - 40;
        const valveY = centerY + 60;
        
        // Dual camshafts
        this.drawCamshaft(20, intakeCamY, width - 40, 'intake');
        this.drawCamshaft(20, exhaustCamY, width - 40, 'exhaust');
        
        // Cylinders and valves
        const cylinderSpacing = (width - 80) / this.cylinderCount;
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = 40 + i * cylinderSpacing + cylinderSpacing / 2;
            const lobe = this.camLobes[i];
            
            // Direct valve actuation (DOHC)
            this.drawDirectActuation(x - 15, intakeCamY, valveY, lobe.intakeLift, 'intake');
            this.drawDirectActuation(x + 15, exhaustCamY, valveY, lobe.exhaustLift, 'exhaust');
            
            // Valves
            this.drawValve(x - 15, valveY, lobe.intakeLift, 'intake');
            this.drawValve(x + 15, valveY, lobe.exhaustLift, 'exhaust');
            
            // Cam lobes
            this.drawCamLobe(x - 15, intakeCamY, lobe.intakeLift, 'intake');
            this.drawCamLobe(x + 15, exhaustCamY, lobe.exhaustLift, 'exhaust');
            
            // Cylinder number
            this.ctx.fillStyle = this.colors.labels;
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${i + 1}`, x, valveY + 40);
        }
        
        this.ctx.fillStyle = this.colors.labels;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('DOHC Configuration', 10, 20);
        this.ctx.fillText('Intake Cam', 10, intakeCamY - 10);
        this.ctx.fillText('Exhaust Cam', 10, exhaustCamY - 10);
    }
    
    drawCamshaft(x, y, width, type) {
        let color = this.colors.shaft;
        if (type === 'intake') color = this.colors.intakeCam;
        if (type === 'exhaust') color = this.colors.exhaustCam;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y - 5, width, 10);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y - 5, width, 10);
    }
    
    drawCamLobe(x, y, lift, type) {
        const baseRadius = 8;
        const liftRadius = baseRadius + lift;
        
        let color = type === 'intake' ? this.colors.intakeCam : this.colors.exhaustCam;
        
        // Cam lobe (elliptical)
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((this.camAngle * Math.PI) / 180);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, liftRadius, baseRadius, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawRockerArm(x, y, lift, type) {
        const color = type === 'intake' ? this.colors.intakeValve : this.colors.exhaustValve;
        
        // Rocker arm pivot
        this.ctx.fillStyle = '#666';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rocker arm
        const armAngle = lift * 0.3; // Rocker multiplies cam motion
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(armAngle);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        this.ctx.lineTo(20, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawDirectActuation(x, camY, valveY, lift, type) {
        const color = type === 'intake' ? this.colors.intakeValve : this.colors.exhaustValve;
        
        // Bucket tappet/follower
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 6, camY + 10, 12, 8);
        
        // Push rod (direct acting)
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, camY + 18);
        this.ctx.lineTo(x, valveY - lift);
        this.ctx.stroke();
    }
    
    drawValve(x, y, lift, type) {
        const color = type === 'intake' ? this.colors.intakeValve : this.colors.exhaustValve;
        
        // Valve stem
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - lift);
        this.ctx.lineTo(x, y + 20 - lift);
        this.ctx.stroke();
        
        // Valve head
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y + 20 - lift, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Valve spring
        this.ctx.strokeStyle = this.colors.spring;
        this.ctx.lineWidth = 2;
        const springCoils = 8;
        this.ctx.beginPath();
        for (let i = 0; i <= springCoils; i++) {
            const springY = y + 5 - lift + (i / springCoils) * 15;
            const springX = x + (i % 2 ? -3 : 3);
            if (i === 0) {
                this.ctx.moveTo(springX, springY);
            } else {
                this.ctx.lineTo(springX, springY);
            }
        }
        this.ctx.stroke();
    }
    
    drawTimingInfo() {
        const width = this.ctx.canvas.width;
        const x = width - 120;
        const y = 30;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x - 5, y - 15, 115, 100);
        
        this.ctx.fillStyle = this.colors.timing;
        this.ctx.font = '10px Arial';
        
        this.ctx.fillText(`Cam Angle: ${Math.round(this.camAngle)}°`, x, y);
        this.ctx.fillText(`Config: ${this.configuration.toUpperCase()}`, x, y + 15);
        
        // Show active valves
        let activeIntake = 0;
        let activeExhaust = 0;
        
        this.camLobes.forEach(lobe => {
            if (lobe.intakeLift > 1) activeIntake++;
            if (lobe.exhaustLift > 1) activeExhaust++;
        });
        
        this.ctx.fillText(`Intake Open: ${activeIntake}`, x, y + 30);
        this.ctx.fillText(`Exhaust Open: ${activeExhaust}`, x, y + 45);
        
        // Current max lifts
        const maxIntakeLift = Math.max(...this.camLobes.map(l => l.intakeLift));
        const maxExhaustLift = Math.max(...this.camLobes.map(l => l.exhaustLift));
        
        this.ctx.fillText(`Max I-Lift: ${maxIntakeLift.toFixed(1)}mm`, x, y + 60);
        this.ctx.fillText(`Max E-Lift: ${maxExhaustLift.toFixed(1)}mm`, x, y + 75);
    }
    
    setConfiguration(config) {
        this.configuration = config;
        this.initializeCamLobes();
    }
    
    setVisible(visible) {
        this.visible = visible;
    }
    
    setCylinderCount(count) {
        this.cylinderCount = count;
        this.initializeCamLobes();
    }
}