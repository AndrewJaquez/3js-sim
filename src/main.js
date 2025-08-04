import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { Inline4Engine } from './engines/Inline4Engine.js';
import { V6Engine } from './engines/V6Engine.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { EngineControls } from './utils/EngineControls.js';

class EngineSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.labelRenderer = null;
        this.controls = null;
        this.composer = null;
        
        this.currentEngine = null;
        this.exhaustSystem = null;
        this.engineControls = null;
        
        this.animationId = null;
        this.clock = new THREE.Clock();
        
        this.settings = {
            rpm: 800,
            throttle: 25,
            airFuelRatio: 14.7,
            ignitionTiming: 15,
            boost: 0,
            cutawayMode: false,
            exhaustVisible: false,
            labelsVisible: true
        };
        
        this.init();
        this.setupControls();
        this.animate();
    }
    
    init() {
        const container = document.getElementById('canvas-container');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(5, 3, 8);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        container.appendChild(this.renderer.domElement);
        
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(this.labelRenderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 1, 0);
        
        this.setupPostProcessing();
        this.setupLighting();
        this.loadEngine('inline4');
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
        
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xff8844, 0.2);
        rimLight.position.set(0, -5, 10);
        this.scene.add(rimLight);
    }
    
    loadEngine(type) {
        if (this.currentEngine) {
            this.scene.remove(this.currentEngine.group);
            this.currentEngine.dispose();
        }
        
        switch (type) {
            case 'inline4':
                this.currentEngine = new Inline4Engine(this.scene);
                break;
            case 'v6':
                this.currentEngine = new V6Engine(this.scene);
                break;
            default:
                console.warn(`Engine type ${type} not implemented yet`);
                return;
        }
        
        this.scene.add(this.currentEngine.group);
        
        if (!this.exhaustSystem) {
            this.exhaustSystem = new ParticleSystem(this.scene);
        }
        
        if (!this.engineControls) {
            this.engineControls = new EngineControls();
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
            labelsToggle: document.getElementById('labelsToggle')
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
    }
    
    updateEngine() {
        if (!this.currentEngine) return;
        
        this.currentEngine.updateSettings(this.settings);
        
        const performance = this.engineControls.calculatePerformance(this.settings);
        
        document.getElementById('powerOutput').textContent = `${performance.power} HP`;
        document.getElementById('torqueOutput').textContent = `${performance.torque} lb-ft`;
        document.getElementById('efficiency').textContent = `${performance.efficiency}%`;
        document.getElementById('temperature').textContent = `${performance.temperature}°F`;
    }
    
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        if (this.currentEngine) {
            this.currentEngine.update(deltaTime);
        }
        
        if (this.exhaustSystem && this.settings.exhaustVisible) {
            this.exhaustSystem.update(deltaTime, this.settings);
        }
        
        this.controls.update();
        
        this.composer.render();
        this.labelRenderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
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
        
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
}

new EngineSimulator();