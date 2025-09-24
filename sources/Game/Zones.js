import * as THREE from 'three/webgpu'
import { Events } from './Events.js'
import { Game } from './Game.js'

export class Zones
{
    constructor()
    {
        this.game = Game.getInstance()

        this.items = []

        this.events = new Events()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })

        this.previewGroup = new THREE.Group()
        this.previewGroup.visible = false
        this.game.scene.add(this.previewGroup)

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🌐 Zones',
                expanded: false,
            })
            this.debugPanel.addBinding(this.previewGroup, 'visible', { label: 'previewVisible' })
        }
    }

    add(name, position, radius)
    {
        this.items.push({ name, position, radius, isIn: false })

        // Preview
        const preview = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 16, 16),
            new THREE.MeshBasicNodeMaterial({ color: '#ffffff', wireframe: true })
        )
        preview.position.copy(position)
        this.previewGroup.add(preview)
    }

    update()
    {
        for(const zone of this.items)
        {
            const distance = this.game.player.position.distanceTo(zone.position)

            if(distance < zone.radius)
            {
                if(!zone.isIn)
                {
                    zone.isIn = true
                    this.events.trigger(zone.name, [ zone ])
                }
            }
            else
            {
                if(zone.isIn)
                {
                    zone.isIn = false
                    this.events.trigger(zone.name, [ zone ])
                }
            }
        }
    }
}