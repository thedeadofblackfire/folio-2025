import { Game } from '../Game.js'
import * as THREE from 'three/webgpu'

export class PhysicsDebug
{
    constructor()
    {
        this.game = new Game()
        this.active = true

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 4))

        this.material = new THREE.LineBasicNodeMaterial({ vertexColors: true })

        this.lineSegments = new THREE.LineSegments(this.geometry, this.material)

        if(this.active)
            this.game.world.scene.add(this.lineSegments)

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 3)

        if(this.game.debug.active)
        {
            this.game.physics.debugPanel.addBinding(this, 'active', { label: 'debug' }).on('change', () =>
            {
                if(this.active)
                    this.game.world.scene.add(this.lineSegments)
                else
                    this.game.world.scene.remove(this.lineSegments)
            })
        }
    }
    
    update()
    {
        if(!this.active)
            return

        const { vertices, colors } = this.game.physics.world.debugRender()

        this.geometry.attributes.position.array = vertices
        this.geometry.attributes.position.count = vertices.length / 3
        this.geometry.attributes.position.needsUpdate = true

        this.geometry.attributes.color.array = colors
        this.geometry.attributes.color.count = colors.length / 4
        this.geometry.attributes.color.needsUpdate = true
    }
}