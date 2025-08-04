import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export class BaseEngine {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.labels = [];
        this.components = {};
        
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
        
        this.materials = this.createMaterials();
        this.initializeComponents();
    }
    
    createMaterials() {
        return {
            steel: new THREE.MeshPhysicalMaterial({
                color: 0x888888,
                metalness: 0.8,
                roughness: 0.2,
                clearcoat: 0.3
            }),
            
            aluminum: new THREE.MeshPhysicalMaterial({
                color: 0xaaaaaa,
                metalness: 0.9,
                roughness: 0.1,
                clearcoat: 0.5
            }),
            
            iron: new THREE.MeshPhysicalMaterial({
                color: 0x333333,
                metalness: 0.7,
                roughness: 0.3
            }),
            
            plastic: new THREE.MeshPhysicalMaterial({
                color: 0x222222,
                metalness: 0.0,
                roughness: 0.8
            }),
            
            copper: new THREE.MeshPhysicalMaterial({
                color: 0xb87333,
                metalness: 0.9,
                roughness: 0.1
            }),
            
            exhaust: new THREE.MeshPhysicalMaterial({
                color: 0x444444,
                metalness: 0.6,
                roughness: 0.4,
                emissive: 0x330000,
                emissiveIntensity: 0.1
            }),
            
            combustion: new THREE.MeshPhysicalMaterial({
                color: 0xff4400,
                emissive: 0xff2200,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            }),
            
            cutaway: new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0.0,
                roughness: 1.0,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            })
        };
    }
    
    initializeComponents() {
        throw new Error('initializeComponents must be implemented by subclass');
    }
    
    createLabel(text, position, className = 'engine-label') {
        const labelDiv = document.createElement('div');
        labelDiv.className = className;
        labelDiv.textContent = text;
        labelDiv.style.marginTop = '-1em';
        labelDiv.style.color = '#00ff00';
        labelDiv.style.fontSize = '12px';
        labelDiv.style.fontFamily = 'Arial, sans-serif';
        labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
        labelDiv.style.padding = '2px 6px';
        labelDiv.style.borderRadius = '3px';
        labelDiv.style.border = '1px solid #00ff00';
        labelDiv.style.pointerEvents = 'none';
        
        const label = new CSS2DObject(labelDiv);
        label.position.copy(position);
        
        this.labels.push(label);
        return label;
    }
    
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
    
    setCutawayMode(enabled) {
        this.cutawayMode = enabled;
        this.updateCutawayVisuals();
    }
    
    setLabelsVisible(visible) {
        this.labelsVisible = visible;
        this.labels.forEach(label => {
            label.visible = visible;
        });
    }
    
    updateCutawayVisuals() {
        
    }
    
    calculateCrankAngle(deltaTime) {
        const rps = this.settings.rpm / 60;
        const anglePerSecond = rps * 360;
        this.crankAngle += anglePerSecond * deltaTime;
        this.crankAngle %= 360;
        return this.crankAngle;
    }
    
    calculatePistonPosition(crankAngle, rodLength = 5, crankRadius = 1.5) {
        const crankRad = THREE.MathUtils.degToRad(crankAngle);
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
    
    update(deltaTime) {
        this.time += deltaTime;
        this.calculateCrankAngle(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateAnimation(deltaTime) {
        
    }
    
    dispose() {
        this.labels.forEach(label => {
            if (label.parent) {
                label.parent.remove(label);
            }
        });
        
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        Object.values(this.materials).forEach(material => material.dispose());
    }
}