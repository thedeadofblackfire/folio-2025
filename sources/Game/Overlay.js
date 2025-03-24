import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import { color, Fn, positionGeometry, uniform, vec4 } from 'three/tsl'
import gsap from 'gsap'

export class Overlay
{
    constructor()
    {
        this.game = Game.getInstance()

        // Uniforms
        const baseColor = uniform(color('#110e16'))
        this.alpha = uniform(0)

        // Geometry
        const geometry = new THREE.PlaneGeometry(2, 2)

        // Material
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false })
        material.outputNode = vec4(baseColor, this.alpha)
        material.vertexNode = vec4(positionGeometry.x, positionGeometry.y, 0, 1)

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)
        mesh.frustumCulled = false
        mesh.renderOrder = 1
        this.game.scene.add(mesh)

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '⬛️ Overlay',
                expanded: false,
            })
            this.game.debug.addThreeColorBinding(debugPanel, baseColor.value, 'color')
            debugPanel.addBinding(this.alpha, 'value', { min: 0, max: 1, step: 0.001 })
        }
    }

    show()
    {
        gsap.to(this.alpha, { value: 1, ease: 'power2.out', overwrite: true, duration: 2 })
    }

    hide()
    {
        gsap.to(this.alpha, { value: 0, ease: 'power2.in', overwrite: true, duration: 2 })
    }
}