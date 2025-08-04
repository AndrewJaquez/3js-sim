export class ParticleSystem2D {
    constructor(sideCtx, topCtx) {
        this.sideCtx = sideCtx;
        this.topCtx = topCtx;
        this.visible = false;
        
        this.particles = [];
        this.maxParticles = 200;
        this.emissionRate = 0;
        this.nextEmission = 0;
        
        this.exhaustPorts = [
            { x: -120, y: -50, vx: -2, vy: -1 },
            { x: -40, y: -50, vx: -2, vy: -1 },
            { x: 40, y: -50, vx: -2, vy: -1 },
            { x: 120, y: -50, vx: -2, vy: -1 }
        ];
        
        this.time = 0;
    }
    
    update(deltaTime, settings) {
        if (!this.visible) return;
        
        this.time += deltaTime;
        
        this.emissionRate = (settings.rpm / 1000) * (settings.throttle / 100) * 10;
        this.nextEmission -= deltaTime;
        
        if (this.nextEmission <= 0 && this.particles.length < this.maxParticles) {
            this.emitParticles(Math.ceil(this.emissionRate));
            this.nextEmission = 1 / 30;
        }
        
        this.updateParticles(deltaTime);
    }
    
    emitParticles(count) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const port = this.exhaustPorts[Math.floor(Math.random() * this.exhaustPorts.length)];
            
            const particle = {
                x: port.x + (Math.random() - 0.5) * 20,
                y: port.y + (Math.random() - 0.5) * 10,
                vx: port.vx + (Math.random() - 0.5) * 2,
                vy: port.vy + Math.random() * 2,
                size: 3 + Math.random() * 8,
                age: 0,
                maxAge: 2 + Math.random() * 3,
                opacity: 0.8
            };
            
            this.particles.push(particle);
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.age += deltaTime;
            particle.x += particle.vx * 60 * deltaTime;
            particle.y += particle.vy * 60 * deltaTime;
            
            particle.vx *= 0.98;
            particle.vy *= 0.95;
            particle.vy -= 0.5 * deltaTime;
            
            particle.size += 15 * deltaTime;
            particle.opacity = Math.max(0, 1 - (particle.age / particle.maxAge));
            
            if (particle.age >= particle.maxAge || particle.opacity <= 0.01) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render() {
        if (!this.visible) return;
        
        this.renderSideView();
        this.renderTopView();
    }
    
    renderSideView() {
        const center = this.getCanvasCenter(this.sideCtx);
        
        this.particles.forEach(particle => {
            this.drawParticle(this.sideCtx, 
                center.x + particle.x, 
                center.y + particle.y, 
                particle.size, 
                particle.opacity
            );
        });
    }
    
    renderTopView() {
        const center = this.getCanvasCenter(this.topCtx);
        
        this.particles.forEach(particle => {
            this.drawParticle(this.topCtx, 
                center.x + particle.x, 
                center.y - particle.vy * 30,
                particle.size * 0.8, 
                particle.opacity * 0.6
            );
        });
    }
    
    drawParticle(ctx, x, y, size, opacity) {
        const heat = Math.max(0, 1 - opacity * 3);
        const r = Math.floor(180 + heat * 75);
        const g = Math.floor(180 - heat * 120);
        const b = Math.floor(180 - heat * 60);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    getCanvasCenter(ctx) {
        return {
            x: ctx.canvas.width / 2,
            y: ctx.canvas.height / 2
        };
    }
    
    setVisible(visible) {
        this.visible = visible;
        if (!visible) {
            this.particles = [];
        }
    }
    
    dispose() {
        this.particles = [];
    }
}