import * as THREE from 'three'
import { positionLocal, varying, max, positionWorld, float, Fn, uniform, color, mix, vec3, vec4, normalWorld } from 'three'
import { Game } from './Game.js'

export class Materials
{
    constructor()
    {
        this.game = new Game()
        this.list = new Map()

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🎨 Materials',
                expanded: false,
            })
        }

        this.setTest()
        this.setNodes()
        this.setPremades()
    }

    setPremades()
    {
        const luminanceCoefficients = new THREE.Vector3()
        THREE.ColorManagement.getLuminanceCoefficients(luminanceCoefficients)

        const getLuminance = (color) =>
        {
            return color.r * luminanceCoefficients.x + color.g * luminanceCoefficients.y + color.b * luminanceCoefficients.z
        }

        const createEmissiveTweak = (material) =>
        {
            const update = () =>
            {
                material.color.set(dummy.color)
                material.color.multiplyScalar(material.userData.intensity / getLuminance(material.color))
            }
            const dummy = { color: material.color.getHex(THREE.SRGBColorSpace) }
            this.debugPanel.addBinding(material.userData, 'intensity', { min: 0, max: 300, step: 1 }).on('change', update)
            this.debugPanel.addBinding(dummy, 'color', { color: { type: 'float' } }).on('change', update)
        }
    
        // Emissive headlight
        const emissiveWarnWhite = new THREE.MeshBasicNodeMaterial({ color: '#fba866' })
        emissiveWarnWhite.name = 'emissiveWarnWhite'
        emissiveWarnWhite.userData.intensity = 100
        emissiveWarnWhite.color.multiplyScalar(emissiveWarnWhite.userData.intensity / getLuminance(emissiveWarnWhite.color))
        createEmissiveTweak(emissiveWarnWhite)
        this.save('emissiveWarnWhite', emissiveWarnWhite)
    
        // Emissive red
        const emissiveRed = new THREE.MeshBasicNodeMaterial({ color: '#ff3131' })
        emissiveRed.name = 'emissiveRed'
        emissiveRed.userData.intensity = 100
        emissiveRed.color.multiplyScalar(emissiveRed.userData.intensity / getLuminance(emissiveRed.color))
        createEmissiveTweak(emissiveRed)
        this.save('emissiveRed', emissiveRed)

    }

    setNodes()
    {
        this.lightBounceColor = uniform(color('#4c4700'))
        this.lightBounceEdgeLow = uniform(float(0))
        this.lightBounceEdgeHigh = uniform(float(1))

        this.shadowColorMultiplier = uniform(color(0.14, 0.17, 0.45))
        this.coreShadowEdgeLow = uniform(float(-0.25))
        this.coreShadowEdgeHigh = uniform(float(1))

        const finalColor = varying(vec3())
        this.lightPositionNode = Fn(([colorBase, totalShadows]) =>
        {
            finalColor.assign(colorBase)

            // Light
            finalColor.assign(finalColor.mul(this.game.lighting.colorUniform.mul(this.game.lighting.intensityUniform)))

            // Bounce color
            const bounceOrientation = normalWorld.dot(vec3(0, - 1, 0)).smoothstep(this.lightBounceEdgeLow, this.lightBounceEdgeHigh)
            const bounceDistance = float(1.5).sub(positionWorld.y).div(1.5).max(0).pow(2)
            finalColor.addAssign(this.lightBounceColor.mul(bounceOrientation).mul(bounceDistance))

            // Core shadow
            const coreShadowMix = normalWorld.dot(this.game.lighting.directionUniform).smoothstep(this.coreShadowEdgeHigh, this.coreShadowEdgeLow)
            
            // Cast shadow
            const castShadowMix = totalShadows.oneMinus()

            // Combined shadows
            const combinedShadowMix = max(coreShadowMix, castShadowMix)
            const shadowColor = colorBase.rgb.mul(this.shadowColorMultiplier).rgb
            finalColor.assign(mix(finalColor, shadowColor, combinedShadowMix))

            // finalColor.assign(combinedShadowMix)
            return positionLocal
        })

        this.lightOutputNode = Fn(() =>
        {
            return vec4(finalColor.rgb, 1)
        })
        
        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel.addBinding({ color: this.lightBounceColor.value.getHex(THREE.SRGBColorSpace) }, 'color', { color: { type: 'float' } })
                .on('change', tweak => { this.lightBounceColor.value.set(tweak.value) })
            this.debugPanel.addBinding(this.lightBounceEdgeLow, 'value', { label: 'lightBounceEdgeLow', min: - 1, max: 1, step: 0.01 })
            this.debugPanel.addBinding(this.lightBounceEdgeHigh, 'value', { label: 'lightBounceEdgeHigh', min: - 1, max: 1, step: 0.01 })

            this.debugPanel.addBinding(this.shadowColorMultiplier, 'value', { label: 'shadowColorMultiplier', color: { type: 'float' } })
            this.debugPanel.addBinding(this.coreShadowEdgeLow, 'value', { label: 'coreShadowEdgeLow', min: - 1, max: 1, step: 0.01 })
            this.debugPanel.addBinding(this.coreShadowEdgeHigh, 'value', { label: 'coreShadowEdgeHigh', min: - 1, max: 1, step: 0.01 })
        }
    }

    setTest()
    {
        this.tests = {}
        this.tests.list = new Map()
        this.tests.sphereGeometry = new THREE.IcosahedronGeometry(1, 3)
        this.tests.boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
        this.tests.group = new THREE.Group()
        this.tests.group.visible = true
        this.game.scene.add(this.tests.group)
        
        this.tests.update = () =>
        {
            this.list.forEach((material, name) =>
            {
                if(!this.tests.list.has(name))
                {
                    const test = {}

                    // Pure
                    const pureColor = material.color.clone()
                    const pureColorVector = new THREE.Vector3(pureColor.r, pureColor.g, pureColor.b)
                    if(pureColorVector.length() > 1)
                        pureColorVector.setLength(1)
                    pureColor.set(pureColorVector.x, pureColorVector.y, pureColorVector.z)
                    
                    const boxPure = new THREE.Mesh(this.tests.boxGeometry, new THREE.MeshBasicMaterial({ color: pureColor }))
                    boxPure.position.y = 0.75
                    boxPure.position.x = this.list.size * 3
                    boxPure.position.z = 0
                    boxPure.castShadow = true
                    boxPure.receiveShadow = true
                    this.tests.group.add(boxPure)
                
                    // Box
                    const box = new THREE.Mesh(this.tests.boxGeometry, material)
                    box.position.y = 0.75
                    box.position.x = this.list.size * 3
                    box.position.z = 3
                    box.castShadow = true
                    box.receiveShadow = true
                    this.tests.group.add(box)

                    // Sphere
                    const sphere = new THREE.Mesh(this.tests.sphereGeometry, material)
                    sphere.position.z = 6
                    sphere.position.y = 0.75
                    sphere.position.x = this.list.size * 3
                    sphere.castShadow = true
                    sphere.receiveShadow = true
                    this.tests.group.add(sphere)

                    this.tests.list.set(name, test)
                    console.log('new test', name)
                }
            })
        }
        
        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel.addBinding(this.tests.group, 'visible', { label: 'testsVisibile' })
        }
    }

    save(name, material)
    {
        this.list.set(name, material)
        this.tests.update()
    }

    getFromName(name, baseMaterial)
    {
        // Return existing material
        if(this.list.has(name))
            return this.list.get(name)

        // Create new
        const material = this.createFromMaterial(baseMaterial)

        // Save
        this.save(name, material)
        return material
    }

    createFromMaterial(baseMaterial)
    {
        let material = baseMaterial

        if(baseMaterial.isMeshStandardMaterial)
        {
            material = new THREE.MeshLambertNodeMaterial()
            this.copy(baseMaterial, material)
        }
        
        if(material.isMeshLambertNodeMaterial)
        {
            // Shadow
            material.shadowSide = THREE.BackSide

            // Shadow receive
            const totalShadows = float(1).toVar()
            material.receivedShadowNode = Fn(([ shadow ]) => 
            {
                totalShadows.mulAssign(shadow)
                return float(1)
            })

            // Output
            material.positionNode = this.lightPositionNode(baseMaterial.color, totalShadows)
            material.outputNode = this.lightOutputNode()
        }

        material.name = baseMaterial.name

        return material
    }

    copy(baseMaterial, targetMaterial)
    {
        const properties = [ 'color' ]

        for(const property of properties)
        {
            if(typeof baseMaterial[property] !== 'undefined' && typeof targetMaterial[property] !== 'undefined')
                targetMaterial[property] = baseMaterial[property]
        }
    }

    updateObject(mesh)
    {
        mesh.traverse((child) =>
        {
            if(child.isMesh)
            {
                child.material = this.getFromName(child.material.name, child.material)
            }
        })
    }
}