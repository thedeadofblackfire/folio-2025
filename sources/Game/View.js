import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { Game } from './Game.js'
import { clamp, lerp, remap, smoothstep } from './utilities/maths.js'

CameraControls.install( { THREE: THREE } )

export class View
{
    constructor()
    {
        this.game = new Game()

        this.mode = 'default'

        this.target = new THREE.Vector3()
        this.smoothedTarget = new THREE.Vector3()

        this.phi = Math.PI * 0.35
        this.theta = Math.PI * 0.25

        this.radius = {}
        this.radius.smoothedValue = 25
        this.radius.low = 25
        this.radius.high = 35
        this.radius.speedLow = 5
        this.radius.speedHigh = 40

        this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.ratio, 0.1, 1000)
        this.game.scene.add(this.camera)

        this.cameraControls = new CameraControls(this.camera, this.game.domElement)
        this.cameraControls.enabled = this.mode === 'controls'
        this.cameraControls.smoothTime = 0.075
        this.cameraControls.draggingSmoothTime = 0.075
        this.cameraControls.dollySpeed = 0.2

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 3)

        this.game.viewport.events.on('change', () =>
        {
            this.resize()
        })

        if(this.game.debug.active)
        {
            const folder = this.game.debug.panel.addFolder({
                title: '📷 View',
                expanded: true,
            })

            folder.addBinding(
                this,
                'mode',
                {
                    options:
                    {
                        default: 'default',
                        controls: 'controls',
                    }
                }
            ).on('change', () => 
            {
                this.smoothedTarget.copy(this.target)

                this.cameraControls.enabled = this.mode === 'controls'
                this.cameraControls.setTarget(this.target.x, this.target.y, this.target.z)
                this.cameraControls.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)
            })
            folder.addBinding(this, 'phi', { min: 0, max: Math.PI * 0.5, step: 0.001 })
            folder.addBinding(this, 'theta', { min: - Math.PI, max: Math.PI, step: 0.001 })

            const radiusFolder = folder.addFolder({
                title: 'Radius',
                expanded: true,
            })
            radiusFolder.addBinding(this.radius, 'low', { min: 0, max: 100, step: 0.001 })
            radiusFolder.addBinding(this.radius, 'high', { min: 0, max: 100, step: 0.001 })
            radiusFolder.addBinding(this.radius, 'speedLow', { min: 0, max: 100, step: 0.001 })
            radiusFolder.addBinding(this.radius, 'speedHigh', { min: 0, max: 100, step: 0.001 })
        }
    }

    resize()
    {
        this.camera.aspect = this.game.viewport.width / this.game.viewport.height
        this.camera.updateProjectionMatrix()
    }

    update()
    {
        // Default mode
        if(this.mode === 'default')
        {
            // Target
            const newSmoothTarget = this.smoothedTarget.clone().lerp(this.target, this.game.time.delta * 10)
            const smoothTargetDelta = newSmoothTarget.clone().sub(this.smoothedTarget)
            const targetSpeed = smoothTargetDelta.length() / this.game.time.delta
            this.smoothedTarget.copy(newSmoothTarget)
            
            // Radius
            const radiusRatio = smoothstep(targetSpeed, this.radius.speedLow, this.radius.speedHigh)
            const radius = lerp(this.radius.low, this.radius.high, radiusRatio)
            this.radius.smoothedValue = lerp(this.radius.smoothedValue, radius, this.game.time.delta * 10)
            
            // Offset
            const offset = new THREE.Vector3().setFromSphericalCoords(this.radius.smoothedValue, this.phi, this.theta)

            // Position
            this.camera.position.copy(this.smoothedTarget).add(offset)

            // Look at
            this.camera.lookAt(this.smoothedTarget)
        }
        
        // Controls mode
        else
        {
            this.cameraControls.update(this.game.time.delta)
        }
    }
}