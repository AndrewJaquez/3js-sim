import * as THREE from 'three';
import { BaseEngine } from './BaseEngine.js';

export class Inline4Engine extends BaseEngine {
    constructor(scene) {
        super(scene);
        
        this.cylinderCount = 4;
        this.cylinderSpacing = 2.5;
        this.crankRadius = 1.5;
        this.rodLength = 5;
        this.pistonHeight = 1.2;
        this.cylinderHeight = 8;
        
        this.pistons = [];
        this.connectingRods = [];
        this.valves = [];
        this.combustionSpheres = [];
        
        this.crankshaft = null;
        this.camshaft = null;
        this.engineBlock = null;
        
        this.setupEngine();
    }
    
    initializeComponents() {
        this.createEngineBlock();
        this.createCrankshaft();
        this.createCamshaft();
        this.createPistons();
        this.createValves();
        this.createCombustionVisualization();
        this.createLabels();
    }
    
    setupEngine() {
        this.initializeComponents();
        
        this.group.position.y = 1;
        this.group.rotation.y = Math.PI / 8;
    }
    
    createEngineBlock() {
        const blockGroup = new THREE.Group();
        
        const blockGeometry = new THREE.BoxGeometry(12, 8, 6);
        const block = new THREE.Mesh(blockGeometry, this.materials.iron);
        block.castShadow = true;
        block.receiveShadow = true;
        blockGroup.add(block);
        
        const cylinderGeometry = new THREE.CylinderGeometry(1.2, 1.2, this.cylinderHeight, 16);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            
            const cylinderLiner = new THREE.Mesh(cylinderGeometry, this.materials.steel);
            cylinderLiner.position.set(x, 2, 0);
            cylinderLiner.castShadow = true;
            cylinderLiner.receiveShadow = true;
            blockGroup.add(cylinderLiner);
            
            const headGeometry = new THREE.BoxGeometry(2.2, 2, 2.2);
            const cylinderHead = new THREE.Mesh(headGeometry, this.materials.aluminum);
            cylinderHead.position.set(x, 6, 0);
            cylinderHead.castShadow = true;
            cylinderHead.receiveShadow = true;
            blockGroup.add(cylinderHead);
        }
        
        const crankCaseGeometry = new THREE.BoxGeometry(12, 3, 6);
        const crankCase = new THREE.Mesh(crankCaseGeometry, this.materials.iron);
        crankCase.position.y = -2.5;
        crankCase.castShadow = true;
        crankCase.receiveShadow = true;
        blockGroup.add(crankCase);
        
        this.engineBlock = blockGroup;
        this.group.add(blockGroup);
    }
    
    createCrankshaft() {
        const crankshaftGroup = new THREE.Group();
        
        const mainJournalGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
        const mainJournal = new THREE.Mesh(mainJournalGeometry, this.materials.steel);
        mainJournal.rotation.z = Math.PI / 2;
        crankshaftGroup.add(mainJournal);
        
        const throwGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
        const webGeometry = new THREE.BoxGeometry(2, 0.5, 1.5);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            const throwAngle = (i % 2) * Math.PI;
            
            const throwGroup = new THREE.Group();
            throwGroup.position.x = x;
            
            const web1 = new THREE.Mesh(webGeometry, this.materials.steel);
            web1.position.set(0, 0, -0.6);
            throwGroup.add(web1);
            
            const web2 = new THREE.Mesh(webGeometry, this.materials.steel);
            web2.position.set(0, 0, 0.6);
            throwGroup.add(web2);
            
            const throw1 = new THREE.Mesh(throwGeometry, this.materials.steel);
            throw1.position.set(0, this.crankRadius, 0);
            throw1.rotation.z = Math.PI / 2;
            throw1.userData = { throwAngle, cylinderIndex: i };
            throwGroup.add(throw1);
            
            crankshaftGroup.add(throwGroup);
        }
        
        crankshaftGroup.position.y = -1.5;
        this.crankshaft = crankshaftGroup;
        this.group.add(crankshaftGroup);
    }
    
    createCamshaft() {
        const camshaftGroup = new THREE.Group();
        
        const shaftGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 16);
        const shaft = new THREE.Mesh(shaftGeometry, this.materials.steel);
        shaft.rotation.z = Math.PI / 2;
        camshaftGroup.add(shaft);
        
        const camGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.8, 8);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            
            const intakeCam = new THREE.Mesh(camGeometry, this.materials.steel);
            intakeCam.position.set(x - 0.4, 0, 0.6);
            intakeCam.rotation.z = Math.PI / 2;
            intakeCam.userData = { type: 'intake', cylinderIndex: i };
            camshaftGroup.add(intakeCam);
            
            const exhaustCam = new THREE.Mesh(camGeometry, this.materials.steel);
            exhaustCam.position.set(x + 0.4, 0, 0.6);
            exhaustCam.rotation.z = Math.PI / 2;
            exhaustCam.userData = { type: 'exhaust', cylinderIndex: i };
            camshaftGroup.add(exhaustCam);
        }
        
        camshaftGroup.position.y = 7;
        this.camshaft = camshaftGroup;
        this.group.add(camshaftGroup);
    }
    
    createPistons() {
        const pistonGeometry = new THREE.CylinderGeometry(1.1, 1.1, this.pistonHeight, 16);
        const rodGeometry = new THREE.CylinderGeometry(0.15, 0.15, this.rodLength, 8);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            
            const pistonGroup = new THREE.Group();
            
            const piston = new THREE.Mesh(pistonGeometry, this.materials.aluminum);
            piston.castShadow = true;
            piston.receiveShadow = true;
            pistonGroup.add(piston);
            
            const rings = [];
            for (let r = 0; r < 3; r++) {
                const ringGeometry = new THREE.TorusGeometry(1.15, 0.05, 8, 16);
                const ring = new THREE.Mesh(ringGeometry, this.materials.steel);
                ring.position.y = 0.3 - (r * 0.3);
                ring.rotation.x = Math.PI / 2;
                rings.push(ring);
                pistonGroup.add(ring);
            }
            
            const connectingRod = new THREE.Mesh(rodGeometry, this.materials.steel);
            connectingRod.position.y = -(this.pistonHeight / 2 + this.rodLength / 2);
            connectingRod.castShadow = true;
            connectingRod.receiveShadow = true;
            pistonGroup.add(connectingRod);
            
            pistonGroup.position.set(x, 2, 0);
            pistonGroup.userData = { cylinderIndex: i, rings };
            
            this.pistons.push(pistonGroup);
            this.connectingRods.push(connectingRod);
            this.group.add(pistonGroup);
        }
    }
    
    createValves() {
        const valveGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const valveHeadGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            
            const intakeValve = new THREE.Group();
            const intakeStem = new THREE.Mesh(valveGeometry, this.materials.steel);
            const intakeHead = new THREE.Mesh(valveHeadGeometry, this.materials.steel);
            intakeHead.position.y = -1;
            intakeValve.add(intakeStem);
            intakeValve.add(intakeHead);
            intakeValve.position.set(x - 0.4, 5.5, 0);
            intakeValve.userData = { type: 'intake', cylinderIndex: i, maxLift: 0.4 };
            
            const exhaustValve = new THREE.Group();
            const exhaustStem = new THREE.Mesh(valveGeometry, this.materials.exhaust);
            const exhaustHead = new THREE.Mesh(valveHeadGeometry, this.materials.exhaust);
            exhaustHead.position.y = -1;
            exhaustValve.add(exhaustStem);
            exhaustValve.add(exhaustHead);
            exhaustValve.position.set(x + 0.4, 5.5, 0);
            exhaustValve.userData = { type: 'exhaust', cylinderIndex: i, maxLift: 0.4 };
            
            this.valves.push(intakeValve, exhaustValve);
            this.group.add(intakeValve);
            this.group.add(exhaustValve);
        }
    }
    
    createCombustionVisualization() {
        const combustionGeometry = new THREE.SphereGeometry(0.8, 16, 12);
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            
            const combustionSphere = new THREE.Mesh(combustionGeometry, this.materials.combustion);
            combustionSphere.position.set(x, 4.5, 0);
            combustionSphere.visible = false;
            combustionSphere.userData = { cylinderIndex: i };
            
            this.combustionSpheres.push(combustionSphere);
            this.group.add(combustionSphere);
        }
    }
    
    createLabels() {
        if (!this.labelsVisible) return;
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const x = (i - 1.5) * this.cylinderSpacing;
            
            const cylinderLabel = this.createLabel(
                `Cylinder ${i + 1}`,
                new THREE.Vector3(x, 6.5, 1.5)
            );
            this.group.add(cylinderLabel);
        }
        
        const crankshaftLabel = this.createLabel(
            'Crankshaft',
            new THREE.Vector3(0, -1.5, 2)
        );
        this.group.add(crankshaftLabel);
        
        const camshaftLabel = this.createLabel(
            'Camshaft',
            new THREE.Vector3(0, 7, 2)
        );
        this.group.add(camshaftLabel);
    }
    
    updateAnimation(deltaTime) {
        const crankAngle = this.crankAngle;
        const crankRad = THREE.MathUtils.degToRad(crankAngle);
        
        if (this.crankshaft) {
            this.crankshaft.rotation.x = crankRad;
        }
        
        if (this.camshaft) {
            this.camshaft.rotation.x = crankRad / 2;
        }
        
        for (let i = 0; i < this.cylinderCount; i++) {
            const cylinderCrankAngle = crankAngle + (i % 2) * 180;
            this.updatePiston(i, cylinderCrankAngle);
            this.updateValves(i, cylinderCrankAngle);
            this.updateCombustion(i, cylinderCrankAngle);
        }
    }
    
    updatePiston(cylinderIndex, crankAngle) {
        if (!this.pistons[cylinderIndex]) return;
        
        const pistonPosition = this.calculatePistonPosition(crankAngle);
        const baseY = 2;
        const offsetY = (pistonPosition - this.crankRadius) * 0.8;
        
        this.pistons[cylinderIndex].position.y = baseY + offsetY;
        
        const rodAngle = Math.atan2(
            this.crankRadius * Math.sin(THREE.MathUtils.degToRad(crankAngle)),
            this.rodLength
        );
        
        if (this.connectingRods[cylinderIndex]) {
            this.connectingRods[cylinderIndex].rotation.z = rodAngle;
        }
    }
    
    updateValves(cylinderIndex, crankAngle) {
        const intakeValveIndex = cylinderIndex * 2;
        const exhaustValveIndex = cylinderIndex * 2 + 1;
        
        if (this.valves[intakeValveIndex]) {
            const intakeLift = this.getValveLift('intake', crankAngle);
            this.valves[intakeValveIndex].position.y = 5.5 - intakeLift;
        }
        
        if (this.valves[exhaustValveIndex]) {
            const exhaustLift = this.getValveLift('exhaust', crankAngle);
            this.valves[exhaustValveIndex].position.y = 5.5 - exhaustLift;
        }
    }
    
    getValveLift(valveType, crankAngle) {
        const camAngle = (crankAngle / 2) % 360;
        const maxLift = 0.4;
        
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
        const combustionSphere = this.combustionSpheres[cylinderIndex];
        if (!combustionSphere) return;
        
        const intensity = this.getCombustionIntensity(cylinderIndex, crankAngle);
        
        if (intensity > 0) {
            combustionSphere.visible = true;
            combustionSphere.scale.setScalar(0.5 + intensity * 0.8);
            
            const emissiveIntensity = intensity * 2;
            combustionSphere.material.emissiveIntensity = emissiveIntensity;
            combustionSphere.material.opacity = Math.min(0.9, intensity * 1.5);
            
            const hue = Math.max(0, 0.1 - intensity * 0.1);
            combustionSphere.material.color.setHSL(hue, 1, 0.6);
            combustionSphere.material.emissive.setHSL(hue, 1, 0.4);
        } else {
            combustionSphere.visible = false;
        }
    }
    
    updateCutawayVisuals() {
        if (!this.engineBlock) return;
        
        this.engineBlock.traverse((child) => {
            if (child.isMesh) {
                if (this.cutawayMode) {
                    child.material = this.materials.cutaway;
                } else {
                    if (child.geometry.type === 'BoxGeometry') {
                        child.material = this.materials.iron;
                    } else {
                        child.material = this.materials.steel;
                    }
                }
            }
        });
    }
    
    getFiringOrder() {
        return [1, 3, 4, 2];
    }
}