import * as THREE from 'three/webgpu'
import { Fn, normalWorld, texture } from 'three/tsl'
import { Game } from '../Game.js'
import { InteractiveAreas } from '../InteractiveAreas.js'
import gsap from 'gsap'

export class Projects
{
    constructor(carpet, interactiveAreaPosition)
    {
        this.game = Game.getInstance()
        this.carpet = carpet
        this.interactiveAreaPosition = interactiveAreaPosition
        this.opened = false

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '📚 Projects',
                expanded: true,
            })
        }

        this.setInteractiveArea()
        this.setInputs()
        this.setCinematic()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel.addButton({ title: 'open', label: 'open' }).on('click', () => { this.open() })
            this.debugPanel.addButton({ title: 'close', label: 'close' }).on('click', () => { this.close() })
        }
    }

    setInteractiveArea()
    {
        this.interactiveArea = this.game.interactiveAreas.create(
            this.interactiveAreaPosition,
            'Projects',
            InteractiveAreas.ALIGN_RIGHT,
            () =>
            {
                this.open()
            }
        )
    }

    setInputs()
    {
        this.game.inputs.events.on('backward', () =>
        {
            this.close()
        })

        this.game.inputs.events.on('left', () =>
        {
            this.previous()
        })

        this.game.inputs.events.on('right', () =>
        {
            this.next()
        })
    }

    setCinematic()
    {
        this.cinematic = {}
        
        this.cinematic.position = new THREE.Vector3()
        this.cinematic.positionOffset = new THREE.Vector3(4.65, 3.35, 4.85)
        
        this.cinematic.target = new THREE.Vector3()
        this.cinematic.targetOffset = new THREE.Vector3(-2.60, 1.60, -4.80)

        const applyPositionAndTarget = () =>
        {
            this.cinematic.position.copy(this.interactiveAreaPosition).add(this.cinematic.positionOffset)
            this.cinematic.target.copy(this.interactiveAreaPosition).add(this.cinematic.targetOffset)
        }
        applyPositionAndTarget()

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.debugPanel.addFolder({
                title: 'cinematic',
                expanded: true,
            })
            debugPanel.addBinding(this.cinematic.positionOffset, 'x', { label: 'positionX', min: - 10, max: 10, step: 0.05 }).on('change', applyPositionAndTarget)
            debugPanel.addBinding(this.cinematic.positionOffset, 'y', { label: 'positionY', min: 0, max: 10, step: 0.05 }).on('change', applyPositionAndTarget)
            debugPanel.addBinding(this.cinematic.positionOffset, 'z', { label: 'positionZ', min: - 10, max: 10, step: 0.05 }).on('change', applyPositionAndTarget)
            debugPanel.addBinding(this.cinematic.targetOffset, 'x', { label: 'targetX', min: - 10, max: 10, step: 0.05 }).on('change', applyPositionAndTarget)
            debugPanel.addBinding(this.cinematic.targetOffset, 'y', { label: 'targetY', min: 0, max: 10, step: 0.05 }).on('change', applyPositionAndTarget)
            debugPanel.addBinding(this.cinematic.targetOffset, 'z', { label: 'targetZ', min: - 10, max: 10, step: 0.05 }).on('change', applyPositionAndTarget)
        }
    }

    open()
    {
        if(this.opened)
            return

        this.opened = true

        // Inputs filters
        this.game.inputs.updateFilters(['cinematic'])

        // View cinematic
        this.game.view.cinematic.start(this.cinematic.position, this.cinematic.target)

        // Interactive area
        this.interactiveArea.hide()
    }

    close()
    {
        if(!this.opened)
            return
            
        this.opened = false

        // Input filters
        this.game.inputs.updateFilters([])

        // View cinematic
        this.game.view.cinematic.end()

        // Interactive area
        gsap.delayedCall(1, () =>
        {
            this.interactiveArea.open()
        })
    }

    previous()
    {
        if(!this.opened)
            return
            
        console.log('previous')
    }

    next()
    {
        if(!this.opened)
            return
            
        console.log('next')
    }
}