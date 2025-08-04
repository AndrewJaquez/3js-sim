import { Inline4Engine2D } from './engines/Inline4Engine2D.js';
import { V6Engine2D } from './engines/V6Engine2D.js';
import { ParticleSystem2D } from './effects/ParticleSystem2D.js';
import { EngineControls } from './utils/EngineControls.js';
import { Turbocharger2D } from './components/Turbocharger2D.js';
import { CamshaftDetail2D } from './components/CamshaftDetail2D.js';

class EngineSimulator2D {
    constructor() {
        this.sideCanvas = null;
        this.topCanvas = null;
        this.turboCanvas = null;
        this.camshaftCanvas = null;
        this.sideCtx = null;
        this.topCtx = null;
        this.turboCtx = null;
        this.camshaftCtx = null;
        
        this.currentEngine = null;
        this.exhaustSystem = null;
        this.turbocharger = null;
        this.camshaftDetail = null;
        this.engineControls = null;
        
        this.animationId = null;
        this.lastTime = 0;
        this.crankAngle = 0;
        
        this.settings = {
            rpm: 800,
            throttle: 25,
            airFuelRatio: 14.7,
            ignitionTiming: 15,
            boost: 0,
            cutawayMode: false,
            exhaustVisible: false,
            labelsVisible: true,
            viewMode: 'both',
            turboEnabled: false,
            camshaftConfig: 'dohc',
            camshaftDetailVisible: true
        };
        
        this.init();
        this.setupControls();
        this.animate();
    }
    
    init() {
        this.sideCanvas = document.getElementById('sideCanvas');
        this.topCanvas = document.getElementById('topCanvas');
        this.turboCanvas = document.getElementById('turboCanvas');
        this.camshaftCanvas = document.getElementById('camshaftCanvas');
        
        if (!this.sideCanvas || !this.topCanvas || !this.turboCanvas || !this.camshaftCanvas) {
            console.error('Canvas elements not found');
            return;
        }
        
        this.sideCtx = this.sideCanvas.getContext('2d');
        this.topCtx = this.topCanvas.getContext('2d');
        this.turboCtx = this.turboCanvas.getContext('2d');
        this.camshaftCtx = this.camshaftCanvas.getContext('2d');
        
        if (!this.sideCtx || !this.topCtx || !this.turboCtx || !this.camshaftCtx) {
            console.error('Could not get 2D context');
            return;
        }
        
        this.resizeCanvases();
        
        // Initial canvas setup
        this.clearCanvases();
        
        // Initial render after setup
        setTimeout(() => {
            if (this.currentEngine) {
                this.currentEngine.render();
            }
        }, 500);
        
        this.loadEngine('inline4');
        
        window.addEventListener('resize', this.resizeCanvases.bind(this));
    }
    
    testRender() {
        // Test side canvas
        if (this.sideCtx) {
            this.sideCtx.fillStyle = '#FF0000';
            this.sideCtx.fillRect(50, 50, 100, 100);
            this.sideCtx.fillStyle = '#00FF00';
            this.sideCtx.font = '20px Arial';
            this.sideCtx.fillText('Side View Test', 50, 200);
        }
        
        // Test top canvas
        if (this.topCtx) {
            this.topCtx.fillStyle = '#0000FF';
            this.topCtx.fillRect(50, 50, 100, 100);
            this.topCtx.fillStyle = '#00FF00';
            this.topCtx.font = '20px Arial';
            this.topCtx.fillText('Top View Test', 50, 200);
        }
    }
    
    resizeCanvases() {
        const containers = [
            { element: document.getElementById('sideViewContainer'), canvas: this.sideCanvas, name: 'Side' },
            { element: document.getElementById('topViewContainer'), canvas: this.topCanvas, name: 'Top' },
            { element: document.getElementById('turboContainer'), canvas: this.turboCanvas, name: 'Turbo' },
            { element: document.getElementById('camshaftContainer'), canvas: this.camshaftCanvas, name: 'Camshaft' }
        ];
        
        containers.forEach(({ element, canvas, name }) => {
            if (element && canvas) {
                const rect = element.getBoundingClientRect();
                canvas.width = Math.max(rect.width - 4, 100); // Account for border
                canvas.height = Math.max(rect.height - 4, 100);
                console.log(`${name} canvas size:`, canvas.width, 'x', canvas.height);
            }
        });
        
        this.setupCanvasStyles();
    }
    
    setupCanvasStyles() {
        [this.sideCtx, this.topCtx, this.turboCtx, this.camshaftCtx].forEach(ctx => {
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        });
    }
    
    loadEngine(type) {
        if (this.currentEngine) {
            this.currentEngine.dispose();
        }
        
        console.log('Loading engine type:', type);
        
        try {
            switch (type) {
                case 'inline4':
                    this.currentEngine = new Inline4Engine2D(this.sideCtx, this.topCtx);
                    break;
                case 'v6':
                    this.currentEngine = new V6Engine2D(this.sideCtx, this.topCtx);
                    break;
                default:
                    console.warn(`Engine type ${type} not implemented yet`);
                    return;
            }
            
            console.log('Engine loaded successfully:', this.currentEngine);
            
            if (!this.exhaustSystem) {
                this.exhaustSystem = new ParticleSystem2D(this.sideCtx, this.topCtx);
            }
            
            if (!this.turbocharger) {
                this.turbocharger = new Turbocharger2D(this.turboCtx);
            }
            
            if (!this.camshaftDetail) {
                this.camshaftDetail = new CamshaftDetail2D(this.camshaftCtx);
                this.camshaftDetail.setCylinderCount(this.currentEngine.cylinderCount || 4);
                this.camshaftDetail.setConfiguration(this.settings.camshaftConfig);
            }
            
            if (!this.engineControls) {
                this.engineControls = new EngineControls();
            }
            
            // Update initial settings
            this.updateEngine();
        } catch (error) {
            console.error('Error loading engine:', error);
        }
    }
    
    setupControls() {
        const elements = {
            rpmSlider: document.getElementById('rpmSlider'),
            rpmDisplay: document.getElementById('rpmDisplay'),
            throttleSlider: document.getElementById('throttleSlider'),
            throttleDisplay: document.getElementById('throttleDisplay'),
            afrSlider: document.getElementById('afrSlider'),
            afrDisplay: document.getElementById('afrDisplay'),
            timingSlider: document.getElementById('timingSlider'),
            timingDisplay: document.getElementById('timingDisplay'),
            boostSlider: document.getElementById('boostSlider'),
            boostDisplay: document.getElementById('boostDisplay'),
            engineType: document.getElementById('engineType'),
            cutawayToggle: document.getElementById('cutawayToggle'),
            exhaustToggle: document.getElementById('exhaustToggle'),
            labelsToggle: document.getElementById('labelsToggle'),
            viewMode: document.getElementById('viewMode'),
            camshaftConfig: document.getElementById('camshaftConfig'),
            turboToggle: document.getElementById('turboToggle'),
            camshaftDetailToggle: document.getElementById('camshaftDetailToggle')
        };
        
        elements.rpmSlider.addEventListener('input', (e) => {
            this.settings.rpm = parseInt(e.target.value);
            elements.rpmDisplay.textContent = this.settings.rpm;
            this.updateEngine();
        });
        
        elements.throttleSlider.addEventListener('input', (e) => {
            this.settings.throttle = parseInt(e.target.value);
            elements.throttleDisplay.textContent = this.settings.throttle;
            this.updateEngine();
        });
        
        elements.afrSlider.addEventListener('input', (e) => {
            this.settings.airFuelRatio = parseFloat(e.target.value);
            elements.afrDisplay.textContent = this.settings.airFuelRatio;
            this.updateEngine();
        });
        
        elements.timingSlider.addEventListener('input', (e) => {
            this.settings.ignitionTiming = parseInt(e.target.value);
            elements.timingDisplay.textContent = this.settings.ignitionTiming;
            this.updateEngine();
        });
        
        elements.boostSlider.addEventListener('input', (e) => {
            this.settings.boost = parseFloat(e.target.value);
            elements.boostDisplay.textContent = this.settings.boost;
            this.updateEngine();
        });
        
        elements.engineType.addEventListener('change', (e) => {
            this.loadEngine(e.target.value);
        });
        
        elements.cutawayToggle.addEventListener('click', () => {
            this.settings.cutawayMode = !this.settings.cutawayMode;
            elements.cutawayToggle.classList.toggle('active', this.settings.cutawayMode);
            if (this.currentEngine) {
                this.currentEngine.setCutawayMode(this.settings.cutawayMode);
            }
        });
        
        elements.exhaustToggle.addEventListener('click', () => {
            this.settings.exhaustVisible = !this.settings.exhaustVisible;
            elements.exhaustToggle.classList.toggle('active', this.settings.exhaustVisible);
            if (this.exhaustSystem) {
                this.exhaustSystem.setVisible(this.settings.exhaustVisible);
            }
        });
        
        elements.labelsToggle.addEventListener('click', () => {
            this.settings.labelsVisible = !this.settings.labelsVisible;
            elements.labelsToggle.classList.toggle('active', this.settings.labelsVisible);
            if (this.currentEngine) {
                this.currentEngine.setLabelsVisible(this.settings.labelsVisible);
            }
        });
        
        elements.viewMode.addEventListener('change', (e) => {
            this.settings.viewMode = e.target.value;
            this.updateViewMode();
        });
        
        elements.camshaftConfig.addEventListener('change', (e) => {
            this.settings.camshaftConfig = e.target.value;
            if (this.camshaftDetail) {
                this.camshaftDetail.setConfiguration(this.settings.camshaftConfig);
            }
            if (this.currentEngine) {
                this.currentEngine.setCamshaftConfig(this.settings.camshaftConfig);
            }
        });
        
        elements.turboToggle.addEventListener('click', () => {
            this.settings.turboEnabled = !this.settings.turboEnabled;
            elements.turboToggle.classList.toggle('active', this.settings.turboEnabled);
            elements.turboToggle.textContent = this.settings.turboEnabled ? 'Disable Turbocharger' : 'Enable Turbocharger';
            if (this.turbocharger) {
                this.turbocharger.setEnabled(this.settings.turboEnabled);
            }
        });
        
        elements.camshaftDetailToggle.addEventListener('click', () => {
            this.settings.camshaftDetailVisible = !this.settings.camshaftDetailVisible;
            elements.camshaftDetailToggle.classList.toggle('active', this.settings.camshaftDetailVisible);
            if (this.camshaftDetail) {
                this.camshaftDetail.setVisible(this.settings.camshaftDetailVisible);
            }
        });
    }
    
    updateViewMode() {
        const sideContainer = document.getElementById('sideViewContainer');
        const topContainer = document.getElementById('topViewContainer');
        
        switch (this.settings.viewMode) {
            case 'side':
                sideContainer.style.display = 'block';
                topContainer.style.display = 'none';
                sideContainer.style.flex = '1';
                break;
            case 'top':
                sideContainer.style.display = 'none';
                topContainer.style.display = 'block';
                topContainer.style.flex = '1';
                break;
            case 'both':
            default:
                sideContainer.style.display = 'block';
                topContainer.style.display = 'block';
                sideContainer.style.flex = '1';
                topContainer.style.flex = '1';
                break;
        }
        
        setTimeout(() => this.resizeCanvases(), 100);
    }
    
    updateEngine() {
        if (!this.currentEngine) return;
        
        // Update boost pressure from turbocharger if enabled
        const adjustedSettings = { ...this.settings };
        if (this.turbocharger && this.settings.turboEnabled) {
            adjustedSettings.boost = this.turbocharger.getBoostPressure();
        }
        
        this.currentEngine.updateSettings(adjustedSettings);
        
        const performance = this.engineControls.calculatePerformance(adjustedSettings);
        
        document.getElementById('powerOutput').textContent = `${performance.power} HP`;
        document.getElementById('torqueOutput').textContent = `${performance.torque} lb-ft`;
        document.getElementById('efficiency').textContent = `${performance.efficiency}%`;
        document.getElementById('temperature').textContent = `${performance.temperature}°F`;
        
        // Update boost display
        document.getElementById('boostDisplay').textContent = adjustedSettings.boost.toFixed(1);
    }
    
    animate(currentTime = 0) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (deltaTime > 0.1) return;
        
        this.clearCanvases();
        
        if (this.currentEngine) {
            try {
                this.currentEngine.update(deltaTime);
                this.currentEngine.render();
                // Track crankshaft angle from engine
                this.crankAngle = this.currentEngine.crankAngle || 0;
            } catch (error) {
                console.error('Error in engine update/render:', error);
                // Fallback rendering
                this.renderFallback();
            }
        } else {
            this.renderFallback();
        }
        
        if (this.exhaustSystem && this.settings.exhaustVisible) {
            try {
                this.exhaustSystem.update(deltaTime, this.settings);
                this.exhaustSystem.render();
            } catch (error) {
                console.error('Error in exhaust system:', error);
            }
        }
        
        if (this.turbocharger) {
            try {
                // Update boost pressure based on turbo
                const adjustedSettings = { ...this.settings };
                if (this.settings.turboEnabled) {
                    adjustedSettings.boost = this.turbocharger.getBoostPressure();
                }
                
                this.turbocharger.update(deltaTime, adjustedSettings);
                this.turbocharger.render();
            } catch (error) {
                console.error('Error in turbocharger system:', error);
            }
        }
        
        if (this.camshaftDetail && this.settings.camshaftDetailVisible) {
            try {
                this.camshaftDetail.update(deltaTime, this.crankAngle || 0, this.settings);
                this.camshaftDetail.render();
            } catch (error) {
                console.error('Error in camshaft detail:', error);
            }
        }
    }
    
    clearCanvases() {
        if (this.settings.viewMode !== 'top' && this.sideCtx && this.sideCanvas) {
            this.sideCtx.clearRect(0, 0, this.sideCanvas.width, this.sideCanvas.height);
            this.drawGrid(this.sideCtx, this.sideCanvas.width, this.sideCanvas.height);
        }
        
        if (this.settings.viewMode !== 'side' && this.topCtx && this.topCanvas) {
            this.topCtx.clearRect(0, 0, this.topCanvas.width, this.topCanvas.height);
            this.drawGrid(this.topCtx, this.topCanvas.width, this.topCanvas.height);
        }
    }
    
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }
    
    renderFallback() {
        if (this.sideCtx && this.sideCanvas) {
            const centerX = this.sideCanvas.width / 2;
            const centerY = this.sideCanvas.height / 2;
            
            this.sideCtx.fillStyle = '#666';
            this.sideCtx.fillRect(centerX - 150, centerY - 50, 300, 100);
            
            this.sideCtx.fillStyle = '#fff';
            this.sideCtx.font = '16px Arial';
            this.sideCtx.fillText('Side View - Engine Loading...', centerX - 100, centerY);
        }
        
        if (this.topCtx && this.topCanvas) {
            const centerX = this.topCanvas.width / 2;
            const centerY = this.topCanvas.height / 2;
            
            this.topCtx.fillStyle = '#666';
            this.topCtx.fillRect(centerX - 150, centerY - 30, 300, 60);
            
            this.topCtx.fillStyle = '#fff';
            this.topCtx.font = '16px Arial';
            this.topCtx.fillText('Top View - Engine Loading...', centerX - 100, centerY);
        }
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.currentEngine) {
            this.currentEngine.dispose();
        }
        
        if (this.exhaustSystem) {
            this.exhaustSystem.dispose();
        }
        
        window.removeEventListener('resize', this.resizeCanvases.bind(this));
    }
}

new EngineSimulator2D();