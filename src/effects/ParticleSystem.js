import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = null;
        this.particleSystem = null;
        this.visible = false;
        
        this.particleCount = 1000;
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.ages = new Float32Array(this.particleCount);
        this.maxAge = 3.0;
        
        this.exhaustPorts = [
            new THREE.Vector3(-3.75, 1, -2),
            new THREE.Vector3(-1.25, 1, -2),
            new THREE.Vector3(1.25, 1, -2),
            new THREE.Vector3(3.75, 1, -2)
        ];
        
        this.time = 0;
        this.nextEmission = 0;
        
        this.createParticleSystem();
    }
    
    createParticleSystem() {
        const geometry = new THREE.BufferGeometry();
        
        for (let i = 0; i < this.particleCount; i++) {
            this.ages[i] = this.maxAge + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('age', new THREE.BufferAttribute(this.ages, 1));
        
        const vertexShader = `
            attribute float age;
            uniform float maxAge;
            uniform float time;
            varying float vAge;
            varying float vOpacity;
            
            void main() {
                vAge = age;
                vOpacity = 1.0 - (age / maxAge);
                
                vec3 pos = position;
                pos.y += age * age * 0.5;
                pos.x += sin(time * 2.0 + age * 3.0) * age * 0.2;
                pos.z += cos(time * 1.5 + age * 2.0) * age * 0.15;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = (8.0 - age * 2.0) * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        
        const fragmentShader = `
            uniform sampler2D smokeTexture;
            uniform float time;
            varying float vAge;
            varying float vOpacity;
            
            void main() {
                vec2 uv = gl_PointCoord;
                
                float distance = length(uv - 0.5);
                if (distance > 0.5) discard;
                
                float alpha = (1.0 - distance * 2.0) * vOpacity;
                
                float heat = max(0.0, 1.0 - vAge * 3.0);
                vec3 coldColor = vec3(0.6, 0.6, 0.7);
                vec3 hotColor = vec3(1.0, 0.3, 0.1);
                vec3 color = mix(coldColor, hotColor, heat);
                
                gl_FragColor = vec4(color, alpha * 0.4);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                time: { value: 0 },
                maxAge: { value: this.maxAge }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.visible = this.visible;
        this.scene.add(this.particleSystem);
    }
    
    update(deltaTime, settings) {
        if (!this.visible || !this.particleSystem) return;
        
        this.time += deltaTime;
        this.particleSystem.material.uniforms.time.value = this.time;
        
        const emissionRate = (settings.rpm / 1000) * (settings.throttle / 100) * 20;
        this.nextEmission -= deltaTime;
        
        if (this.nextEmission <= 0) {
            this.emitParticles(Math.ceil(emissionRate));
            this.nextEmission = 1 / 60;
        }
        
        this.updateParticles(deltaTime, settings);
        
        const positionAttribute = this.particleSystem.geometry.getAttribute('position');
        const ageAttribute = this.particleSystem.geometry.getAttribute('age');
        
        positionAttribute.needsUpdate = true;
        ageAttribute.needsUpdate = true;
    }
    
    emitParticles(count) {
        let emitted = 0;
        
        for (let i = 0; i < this.particleCount && emitted < count; i++) {
            if (this.ages[i] > this.maxAge) {
                const portIndex = Math.floor(Math.random() * this.exhaustPorts.length);
                const port = this.exhaustPorts[portIndex];
                
                this.positions[i * 3] = port.x + (Math.random() - 0.5) * 0.2;
                this.positions[i * 3 + 1] = port.y + (Math.random() - 0.5) * 0.2;
                this.positions[i * 3 + 2] = port.z + (Math.random() - 0.5) * 0.2;
                
                this.velocities[i * 3] = (Math.random() - 0.5) * 2;
                this.velocities[i * 3 + 1] = 2 + Math.random() * 3;
                this.velocities[i * 3 + 2] = -2 - Math.random() * 2;
                
                this.ages[i] = 0;
                emitted++;
            }
        }
    }
    
    updateParticles(deltaTime, settings) {
        for (let i = 0; i < this.particleCount; i++) {
            if (this.ages[i] <= this.maxAge) {
                this.ages[i] += deltaTime;
                
                this.positions[i * 3] += this.velocities[i * 3] * deltaTime;
                this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * deltaTime;
                this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * deltaTime;
                
                this.velocities[i * 3] *= 0.98;
                this.velocities[i * 3 + 1] *= 0.95;
                this.velocities[i * 3 + 2] *= 0.98;
                
                this.velocities[i * 3 + 1] += -0.5 * deltaTime;
            }
        }
    }
    
    setVisible(visible) {
        this.visible = visible;
        if (this.particleSystem) {
            this.particleSystem.visible = visible;
        }
    }
    
    dispose() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
    }
}