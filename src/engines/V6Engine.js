import * as THREE from 'three';
import { BaseEngine } from './BaseEngine.js';

export class V6Engine extends BaseEngine {
    constructor(scene) {
        super(scene);
        
        this.cylinderCount = 6;
        this.vAngle = 60;
        this.cylinderSpacing = 2.0;
        this.crankRadius = 1.6;
        this.rodLength = 5.2;
        this.pistonHeight = 1.3;
        this.cylinderHeight = 7.5;
        
        this.pistons = [];
        this.connectingRods = [];
        this.valves = [];
        this.combustionSpheres = [];
        
        this.crankshaft = null;
        this.camshafts = [];
        this.engineBlocks = [];
        
        this.setupEngine();
    }
    
    initializeComponents() {
        this.createEngineBlocks();
        this.createCrankshaft();
        this.createCamshafts();
        this.createPistons();
        this.createValves();
        this.createCombustionVisualization();
        this.createLabels();
    }
    
    setupEngine() {
        this.initializeComponents();
        this.group.position.y = 1;
        this.group.rotation.y = Math.PI / 6;
    }
    
    createEngineBlocks() {
        const leftBankGroup = new THREE.Group();
        const rightBankGroup = new THREE.Group();
        
        const bankAngle = THREE.MathUtils.degToRad(this.vAngle / 2);
        
        leftBankGroup.rotation.z = bankAngle;
        rightBankGroup.rotation.z = -bankAngle;
        
        [leftBankGroup, rightBankGroup].forEach((bank, bankIndex) => {
            const blockGeometry = new THREE.BoxGeometry(8, 6, 4);
            const block = new THREE.Mesh(blockGeometry, this.materials.iron);
            block.castShadow = true;
            block.receiveShadow = true;
            bank.add(block);
            
            const cylinderGeometry = new THREE.CylinderGeometry(1.1, 1.1, this.cylinderHeight, 16);
            
            for (let i = 0; i < 3; i++) {
                const x = (i - 1) * this.cylinderSpacing;
                
                const cylinderLiner = new THREE.Mesh(cylinderGeometry, this.materials.steel);
                cylinderLiner.position.set(x, 2, 0);
                cylinderLiner.castShadow = true;
                cylinderLiner.receiveShadow = true;
                bank.add(cylinderLiner);
                
                const headGeometry = new THREE.BoxGeometry(2, 1.8, 2);
                const cylinderHead = new THREE.Mesh(headGeometry, this.materials.aluminum);
                cylinderHead.position.set(x, 5.5, 0);
                cylinderHead.castShadow = true;
                cylinderHead.receiveShadow = true;
                bank.add(cylinderHead);
            }
            
            this.engineBlocks.push(bank);
            this.group.add(bank);
        });
        
        const crankCaseGeometry = new THREE.BoxGeometry(10, 3.5, 5);
        const crankCase = new THREE.Mesh(crankCaseGeometry, this.materials.iron);
        crankCase.position.y = -2.5;
        crankCase.castShadow = true;
        crankCase.receiveShadow = true;
        this.group.add(crankCase);
    }
    
    createCrankshaft() {
        const crankshaftGroup = new THREE.Group();
        
        const mainJournalGeometry = new THREE.CylinderGeometry(0.45, 0.45, 10, 16);
        const mainJournal = new THREE.Mesh(mainJournalGeometry, this.materials.steel);
        mainJournal.rotation.z = Math.PI / 2;
        crankshaftGroup.add(mainJournal);
        
        const throwGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
        const webGeometry = new THREE.BoxGeometry(2.2, 0.6, 1.8);
        
        const crankPositions = [-3, -1, 1, 3];
        const throwAngles = [0, 120, 240, 0, 120, 240];
        
        for (let i = 0; i < 4; i++) {
            const x = crankPositions[i];
            
            const throwGroup = new THREE.Group();
            throwGroup.position.x = x;
            
            const web1 = new THREE.Mesh(webGeometry, this.materials.steel);
            web1.position.set(0, 0, -0.7);
            throwGroup.add(web1);
            
            const web2 = new THREE.Mesh(webGeometry, this.materials.steel);
            web2.position.set(0, 0, 0.7);
            throwGroup.add(web2);
            
            if (i < 3) {
                const leftThrowAngle = THREE.MathUtils.degToRad(throwAngles[i * 2]);
                const rightThrowAngle = THREE.MathUtils.degToRad(throwAngles[i * 2 + 1]);
                
                const leftThrow = new THREE.Mesh(throwGeometry, this.materials.steel);
                leftThrow.position.set(
                    this.crankRadius * Math.cos(leftThrowAngle + Math.PI/2),
                    this.crankRadius * Math.sin(leftThrowAngle + Math.PI/2),
                    0.5
                );
                leftThrow.rotation.z = Math.PI / 2;
                leftThrow.userData = { throwAngle: throwAngles[i * 2], cylinderIndex: i * 2, bank: 'left' };
                throwGroup.add(leftThrow);
                
                const rightThrow = new THREE.Mesh(throwGeometry, this.materials.steel);
                rightThrow.position.set(
                    this.crankRadius * Math.cos(rightThrowAngle + Math.PI/2),
                    this.crankRadius * Math.sin(rightThrowAngle + Math.PI/2),
                    -0.5
                );
                rightThrow.rotation.z = Math.PI / 2;
                rightThrow.userData = { throwAngle: throwAngles[i * 2 + 1], cylinderIndex: i * 2 + 1, bank: 'right' };
                throwGroup.add(rightThrow);
            }
            
            crankshaftGroup.add(throwGroup);
        }
        
        crankshaftGroup.position.y = -1.5;
        this.crankshaft = crankshaftGroup;
        this.group.add(crankshaftGroup);
    }
    
    createCamshafts() {
        ['left', 'right'].forEach((side, sideIndex) => {
            const camshaftGroup = new THREE.Group();
            
            const shaftGeometry = new THREE.CylinderGeometry(0.22, 0.22, 8, 16);
            const shaft = new THREE.Mesh(shaftGeometry, this.materials.steel);
            shaft.rotation.z = Math.PI / 2;
            camshaftGroup.add(shaft);
            
            const camGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.7, 8);
            
            for (let i = 0; i < 3; i++) {
                const x = (i - 1) * this.cylinderSpacing;
                
                const intakeCam = new THREE.Mesh(camGeometry, this.materials.steel);
                intakeCam.position.set(x - 0.3, 0, 0.5);
                intakeCam.rotation.z = Math.PI / 2;
                intakeCam.userData = { type: 'intake', cylinderIndex: i + sideIndex * 3 };
                camshaftGroup.add(intakeCam);
                
                const exhaustCam = new THREE.Mesh(camGeometry, this.materials.steel);
                exhaustCam.position.set(x + 0.3, 0, 0.5);
                exhaustCam.rotation.z = Math.PI / 2;
                exhaustCam.userData = { type: 'exhaust', cylinderIndex: i + sideIndex * 3 };
                camshaftGroup.add(exhaustCam);
            }
            
            const bankAngle = THREE.MathUtils.degToRad(this.vAngle / 2);
            camshaftGroup.rotation.z = sideIndex === 0 ? bankAngle : -bankAngle;
            camshaftGroup.position.y = 6.5;
            
            this.camshafts.push(camshaftGroup);
            this.group.add(camshaftGroup);
        });
    }
    
    createPistons() {
        const pistonGeometry = new THREE.CylinderGeometry(1.05, 1.05, this.pistonHeight, 16);
        const rodGeometry = new THREE.CylinderGeometry(0.16, 0.16, this.rodLength, 8);
        
        ['left', 'right'].forEach((side, sideIndex) => {
            const bankAngle = THREE.MathUtils.degToRad(this.vAngle / 2);
            const rotation = sideIndex === 0 ? bankAngle : -bankAngle;
            
            for (let i = 0; i < 3; i++) {
                const cylinderIndex = i + sideIndex * 3;
                const x = (i - 1) * this.cylinderSpacing;
                
                const pistonGroup = new THREE.Group();
                
                const piston = new THREE.Mesh(pistonGeometry, this.materials.aluminum);
                piston.castShadow = true;
                piston.receiveShadow = true;
                pistonGroup.add(piston);
                
                const connectingRod = new THREE.Mesh(rodGeometry, this.materials.steel);
                connectingRod.position.y = -(this.pistonHeight / 2 + this.rodLength / 2);
                connectingRod.castShadow = true;
                connectingRod.receiveShadow = true;
                pistonGroup.add(connectingRod);
                
                pistonGroup.position.set(x, 2, 0);
                pistonGroup.rotation.z = rotation;
                pistonGroup.userData = { cylinderIndex, side, bankIndex: sideIndex };
                
                this.pistons.push(pistonGroup);
                this.connectingRods.push(connectingRod);
                this.group.add(pistonGroup);
            }
        });
    }
    
    createValves() {
        const valveGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
        const valveHeadGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 12);
        
        ['left', 'right'].forEach((side, sideIndex) => {
            const bankAngle = THREE.MathUtils.degToRad(this.vAngle / 2);
            const rotation = sideIndex === 0 ? bankAngle : -bankAngle;
            
            for (let i = 0; i < 3; i++) {
                const cylinderIndex = i + sideIndex * 3;
                const x = (i - 1) * this.cylinderSpacing;
                
                const intakeValve = new THREE.Group();
                const intakeStem = new THREE.Mesh(valveGeometry, this.materials.steel);
                const intakeHead = new THREE.Mesh(valveHeadGeometry, this.materials.steel);
                intakeHead.position.y = -0.9;
                intakeValve.add(intakeStem);
                intakeValve.add(intakeHead);
                intakeValve.position.set(x - 0.3, 5, 0);
                intakeValve.rotation.z = rotation;
                intakeValve.userData = { type: 'intake', cylinderIndex, maxLift: 0.35 };
                
                const exhaustValve = new THREE.Group();
                const exhaustStem = new THREE.Mesh(valveGeometry, this.materials.exhaust);
                const exhaustHead = new THREE.Mesh(valveHeadGeometry, this.materials.exhaust);
                exhaustHead.position.y = -0.9;
                exhaustValve.add(exhaustStem);
                exhaustValve.add(exhaustHead);
                exhaustValve.position.set(x + 0.3, 5, 0);
                exhaustValve.rotation.z = rotation;
                exhaustValve.userData = { type: 'exhaust', cylinderIndex, maxLift: 0.35 };
                
                this.valves.push(intakeValve, exhaustValve);
                this.group.add(intakeValve);
                this.group.add(exhaustValve);
            }
        });
    }
    
    createCombustionVisualization() {
        const combustionGeometry = new THREE.SphereGeometry(0.7, 16, 12);
        
        ['left', 'right'].forEach((side, sideIndex) => {
            const bankAngle = THREE.MathUtils.degToRad(this.vAngle / 2);
            const yOffset = Math.sin(bankAngle) * 2;
            const zOffset = Math.cos(bankAngle) * 2;
            
            for (let i = 0; i < 3; i++) {
                const cylinderIndex = i + sideIndex * 3;
                const x = (i - 1) * this.cylinderSpacing;
                
                const combustionSphere = new THREE.Mesh(combustionGeometry, this.materials.combustion);
                combustionSphere.position.set(
                    x,
                    4 + (sideIndex === 0 ? yOffset : -yOffset),
                    sideIndex === 0 ? zOffset : -zOffset
                );
                combustionSphere.visible = false;
                combustionSphere.userData = { cylinderIndex };
                
                this.combustionSpheres.push(combustionSphere);
                this.group.add(combustionSphere);
            }
        });
    }
    
    createLabels() {
        if (!this.labelsVisible) return;
        
        ['left', 'right'].forEach((side, sideIndex) => {
            for (let i = 0; i < 3; i++) {
                const cylinderIndex = i + sideIndex * 3;
                const x = (i - 1) * this.cylinderSpacing;
                const bankAngle = THREE.MathUtils.degToRad(this.vAngle / 2);
                const yOffset = Math.sin(bankAngle) * 3;
                const zOffset = Math.cos(bankAngle) * 3;
                
                const cylinderLabel = this.createLabel(
                    `Cyl ${cylinderIndex + 1} (${side.toUpperCase()})`,
                    new THREE.Vector3(
                        x,
                        6 + (sideIndex === 0 ? yOffset : -yOffset),
                        1.5 + (sideIndex === 0 ? zOffset : -zOffset)
                    )
                );
                this.group.add(cylinderLabel);
            }
        });
        
        const crankshaftLabel = this.createLabel(
            'V6 Crankshaft',
            new THREE.Vector3(0, -1.5, 3)
        );
        this.group.add(crankshaftLabel);
    }
    
    updateAnimation(deltaTime) {
        const crankAngle = this.crankAngle;
        const crankRad = THREE.MathUtils.degToRad(crankAngle);
        
        if (this.crankshaft) {
            this.crankshaft.rotation.x = crankRad;
        }
        
        this.camshafts.forEach(camshaft => {
            camshaft.rotation.x = crankRad / 2;
        });
        
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
        if (!this.pistons[cylinderIndex]) return;
        
        const pistonPosition = this.calculatePistonPosition(crankAngle);
        const baseY = 2;
        const offsetY = (pistonPosition - this.crankRadius) * 0.7;
        
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
            this.valves[intakeValveIndex].position.y = 5 - intakeLift;
        }
        
        if (this.valves[exhaustValveIndex]) {
            const exhaustLift = this.getValveLift('exhaust', crankAngle);
            this.valves[exhaustValveIndex].position.y = 5 - exhaustLift;
        }
    }
    
    getValveLift(valveType, crankAngle) {
        const camAngle = (crankAngle / 2) % 360;
        const maxLift = 0.35;
        
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
            combustionSphere.scale.setScalar(0.4 + intensity * 0.7);
            
            const emissiveIntensity = intensity * 1.8;
            combustionSphere.material.emissiveIntensity = emissiveIntensity;
            combustionSphere.material.opacity = Math.min(0.85, intensity * 1.4);
            
            const hue = Math.max(0, 0.08 - intensity * 0.08);
            combustionSphere.material.color.setHSL(hue, 1, 0.6);
            combustionSphere.material.emissive.setHSL(hue, 1, 0.4);
        } else {
            combustionSphere.visible = false;
        }
    }
    
    updateCutawayVisuals() {
        this.engineBlocks.forEach(block => {
            block.traverse((child) => {
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
        });
    }
    
    getFiringOrder() {
        return [1, 4, 2, 5, 3, 6];
    }
}