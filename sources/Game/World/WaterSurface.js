import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import MeshGridMaterial, { MeshGridMaterialLine } from '../Materials/MeshGridMaterial.js'
import { color, Fn, mix, output, positionGeometry, positionLocal, positionWorld, remap, remapClamp, sin, smoothstep, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'

export class WaterSurface
{
    constructor()
    {
        this.game = Game.getInstance()

        this.localTime = uniform(0)
        this.timeFrequency = 0.01

        // Geometry
        const halfExtent = this.game.view.optimalArea.radius
        this.geometry = new THREE.PlaneGeometry(halfExtent * 2, halfExtent * 2, 1, 1)
        this.geometry.rotateX(- Math.PI * 0.5)

        // Material
        this.material = new THREE.MeshLambertNodeMaterial({ color: '#ffffff', wireframe: false })

        const totalShadow = this.game.lighting.addTotalShadowToMaterial(this.material)

        const slopeFrequency = uniform(10)
        const noiseFrequency = uniform(0.1)
        const threshold = uniform(-0.2)
        const noiseOffset = uniform(0.345)

        this.material.outputNode = Fn(() =>
        {
            const terrainUv = this.game.terrainData.worldPositionToUvNode(positionWorld.xz)
            const terrainData = this.game.terrainData.terrainDataNode(terrainUv)
            
            const baseRipple = terrainData.b.add(this.localTime).mul(slopeFrequency).toVar()
            const rippleIndex = baseRipple.floor()

            const noise = texture(
                this.game.noises.texture,
                positionWorld.xz.add(rippleIndex.div(noiseOffset)
            ).mul(noiseFrequency)).r
            
            const ripple = terrainData.b
                .add(this.localTime)
                .mul(slopeFrequency)
                .mod(1)
                .sub(terrainData.b.oneMinus())
                .add(noise)

            ripple.greaterThan(threshold).discard()

            return this.game.lighting.lightOutputNodeBuilder(vec3(1), totalShadow, false, false)
        })()

        // Mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = - 0.3
        this.mesh.receiveShadow = true
        this.game.scene.add(this.mesh)

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '🌊 Water',
                expanded: false,
            })

            debugPanel.addBinding(this, 'timeFrequency', { min: 0, max: 0.1, step: 0.001 })
            debugPanel.addBinding(slopeFrequency, 'value', { label: 'slopeFrequency', min: 0, max: 50, step: 0.01 })
            debugPanel.addBinding(noiseFrequency, 'value', { label: 'noiseFrequency', min: 0, max: 1, step: 0.01 })
            debugPanel.addBinding(threshold, 'value', { label: 'threshold', min: -1, max: 0, step: 0.01 })
            debugPanel.addBinding(noiseOffset, 'value', { label: 'noiseOffset', min: 0, max: 1, step: 0.001 })
        }

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * this.timeFrequency

        this.mesh.position.x = this.game.view.optimalArea.position.x
        this.mesh.position.z = this.game.view.optimalArea.position.z
    }
}