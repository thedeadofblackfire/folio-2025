import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { Game } from './Game.js'
import { clamp, lerp, remap, smoothstep } from './utilities/maths.js'
import { atan2, cos, sin, uniform, PI, vec3, time, modelViewMatrix, cameraProjectionMatrix, viewport, vec4, Fn, positionGeometry, positionLocal, attribute } from 'three'

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
        this.camera.position.setFromSphericalCoords(this.radius.smoothedValue, this.phi, this.theta)
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
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '📷 View',
                expanded: true,
            })

            this.debugPanel.addBinding(
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
            this.debugPanel.addBinding(this, 'phi', { min: 0, max: Math.PI * 0.5, step: 0.001 })
            this.debugPanel.addBinding(this, 'theta', { min: - Math.PI, max: Math.PI, step: 0.001 })

            const radiusFolder = this.debugPanel.addFolder({
                title: 'Radius',
                expanded: true,
            })
            radiusFolder.addBinding(this.radius, 'low', { min: 0, max: 100, step: 0.001 })
            radiusFolder.addBinding(this.radius, 'high', { min: 0, max: 100, step: 0.001 })
            radiusFolder.addBinding(this.radius, 'speedLow', { min: 0, max: 100, step: 0.001 })
            radiusFolder.addBinding(this.radius, 'speedHigh', { min: 0, max: 100, step: 0.001 })
        }

        this.setSpeedLines()
    }

    setSpeedLines()
    {
        this.speedLines = {}
        this.speedLines.strength = uniform(0)
        this.speedLines.targetStrength = 0
        this.speedLines.speed = uniform(25)

        const linesCount = 30
        const positionArray = new Float32Array(linesCount * 3 * 3)
        const indexArray = new Float32Array(linesCount * 3)
        const maxDistance = Math.hypot(1, 1)

        for(let i = 0; i < linesCount; i++)
        {
            // Base vertex
            const base = new THREE.Vector2(0, 1)
            const angle = Math.PI * 2 * Math.random()
            base.rotateAround(new THREE.Vector2(), angle)

            // Side vertices 
            const thickness = Math.random() * 0.05 + 0.003
            const sideA = base.clone().rotateAround(new THREE.Vector2(), thickness)
            const sideB = base.clone().rotateAround(new THREE.Vector2(), - thickness)
            
            // Distance to center
            sideA.multiplyScalar(maxDistance)
            sideB.multiplyScalar(maxDistance)
            base.multiplyScalar(maxDistance * Math.random() * 0.5)

            // Save in position array
            const i9 = i * 9

            positionArray[i9 + 0] = sideA.x
            positionArray[i9 + 1] = sideA.y
            positionArray[i9 + 2] = 0
            
            positionArray[i9 + 3] = base.x
            positionArray[i9 + 4] = base.y
            positionArray[i9 + 5] = 0

            positionArray[i9 + 6] = sideB.x
            positionArray[i9 + 7] = sideB.y
            positionArray[i9 + 8] = 0

            // Save index
            const i3 = i * 3
            indexArray[i3 + 0] = i
            indexArray[i3 + 1] = i
            indexArray[i3 + 2] = i
        }

        this.speedLines.geometry = new THREE.BufferGeometry()
        this.speedLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3))
        this.speedLines.geometry.setAttribute('index', new THREE.Float32BufferAttribute(indexArray, 1))

        this.speedLines.material = new THREE.MeshBasicNodeMaterial({ wireframe: false, depthWrite: false, depthTest: false })
        this.speedLines.material.vertexNode = Fn(() =>
        {
            const lineIndex = attribute('index')
            const lineRatio = time.mul(this.speedLines.speed).add(lineIndex).sin().div(2).add(0.5)

            const newPosition = positionGeometry.toVar()
            const length = newPosition.xy.length()
            const angle = atan2(newPosition.y, newPosition.x)
            length.addAssign(lineRatio.add(this.speedLines.strength.oneMinus().mul(maxDistance)))
            newPosition.x.assign(cos(angle).mul(length))
            newPosition.y.assign(sin(angle).mul(length))
            
            return vec4(newPosition, 1)
        })()
        this.speedLines.material.outputNode = vec4(1)

        this.speedLines.mesh = new THREE.Mesh(this.speedLines.geometry, this.speedLines.material)
        this.speedLines.mesh.frustumCulled = false
        this.speedLines.mesh.renderOrder = 10
        this.game.scene.add(this.speedLines.mesh)

        // Debug
        if(this.game.debug.active)
        {
            const folder = this.debugPanel.addFolder({
                title: 'Speed lines',
                expanded: true,
            })
            folder.addBinding(this.speedLines, 'targetStrength', { label: 'strength', min: 0, max: 1, step: 0.001 })
            folder.addBinding(this.speedLines.speed, 'value', { label: 'speed', min: 0, max: 100, step: 0.001 })
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

        // Speed lines
        this.speedLines.strength.value = lerp(this.speedLines.strength.value, this.speedLines.targetStrength, this.game.time.delta * 2)
    }
}