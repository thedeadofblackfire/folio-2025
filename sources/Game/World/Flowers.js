import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { attribute, color, float, Fn, instance, instancedBufferAttribute, instanceIndex, luminance, mix, normalWorld, positionLocal, texture, uniform, uniformArray, uv, vec3, vec4 } from 'three/tsl'
import { remap, smoothstep } from '../utilities/maths.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class Flowers
{
    constructor()
    {
        this.game = Game.getInstance()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🌸 Flowers',
                expanded: false,
            })
        }

        this.setColors()
        // this.setOne()
        this.setClusters()
        
        this.setGeometry()
        this.setMaterial()
        this.setInstancedMesh()
    }

    setColors()
    {
        this.colors = {}
        this.colors.presets = [
            new THREE.Color('#ffffff'),
            new THREE.Color('#8900ff'),
            new THREE.Color('#a4ffb9'),
            new THREE.Color('#ff3e00'),
        ]

        this.colors.array = []

        for(const _preset of this.colors.presets)
        {
            if(this.game.debug.active)
                this.game.debug.addThreeColorBinding(this.debugPanel, _preset, 'color').on('change', () => { this.colors.updateArray() })
        }

        this.colors.updateArray = () =>
        {
            let i = 0
            for(const _preset of this.colors.presets)
            {
                _preset.toArray(this.colors.array, i * 3)
                i++
            }
        }

        this.colors.updateArray()

        this.colors.uniform = uniformArray(this.colors.array)
    }

    setOne()
    {
        this.transformMatrices = []
        const object = new THREE.Object3D()
        object.position.set(0, 0.4, 4)
        object.scale.set(1, 1, 1)
        
        object.updateMatrix()

        this.transformMatrices.push(object.matrix)
    }

    setClusters()
    {
        this.transformMatrices = []

        this.colorIndices = []

        let i = 0
        for(const reference of this.game.resources.flowersReferencesModel.scene.children)
        {
            const clusterPosition = reference.position

            const colorIndex = i % this.colors.presets.length

            const clusterCount = 3 + Math.floor(Math.random() * 8)
            // const clusterCount = 1
            for(let j = 0; j < clusterCount; j++)
            {
                // Transform matrix
                const object = new THREE.Object3D()
                
                object.rotation.y = Math.PI * 2 * Math.random()

                object.position.set(
                    clusterPosition.x + (Math.random() - 0.5) * 3,
                    clusterPosition.y,
                    clusterPosition.z + (Math.random() - 0.5) * 3
                )

                const scale = 0.6 + Math.random() * 0.4
                object.scale.setScalar(scale)
                
                object.updateMatrix()

                this.transformMatrices.push(object.matrix)

                // Color index
                this.colorIndices.push(colorIndex)
            }
            i++
        }
    }

    setGeometry()
    {
        const count = 8
        const planes = []

        const colorMixerArray = new Float32Array(count * 4)

        for(let i = 0; i < count; i++)
        {
            const plane = new THREE.PlaneGeometry(0.2, 0.2)

            // Position
            const spherical = new THREE.Spherical(
                1,
                Math.PI * 0.5 * Math.random(),
                Math.PI * 2 * Math.random()
            )
            const direction = new THREE.Vector3().setFromSpherical(spherical)
            const position = direction.clone().setLength(1 - Math.pow(Math.random(), 2))
            position.y *= 0.5
            const randomUpAngle = Math.random() * Math.PI * 2
            
            const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), direction, new THREE.Vector3(Math.sin(randomUpAngle), Math.cos(randomUpAngle), 0))
            matrix.setPosition(position)
            
            plane.applyMatrix4(matrix)

            // Color mixer
            const colorMixer = Math.random()
            colorMixerArray[i * 4 + 0] = colorMixer
            colorMixerArray[i * 4 + 1] = colorMixer
            colorMixerArray[i * 4 + 2] = colorMixer
            colorMixerArray[i * 4 + 3] = colorMixer

            // Save
            planes.push(plane)
        }

        // Merge all planes
        this.geometry = mergeGeometries(planes)

        // Remove unsused attributes
        this.geometry.deleteAttribute('uv')

        // Add attribute
        this.geometry.setAttribute('colorMixer', new THREE.Float32BufferAttribute(colorMixerArray, 1))
    
    }

    setMaterial()
    {
        const colorNode = Fn(() =>
        {
            const colorIndex = instancedBufferAttribute(this.instanceColorIndex, 'float', 1)

            const baseColor = vec3(
                this.colors.uniform.element(colorIndex.mul(3).add(0)),
                this.colors.uniform.element(colorIndex.mul(3).add(1)),
                this.colors.uniform.element(colorIndex.mul(3).add(2))
            )
            const colorMixer = attribute('colorMixer')
            const mixedColor = mix(baseColor, this.game.terrain.grassColorUniform, colorMixer)

            return mixedColor
        })()

        this.material = new MeshDefaultMaterial({
            side: THREE.DoubleSide,
            colorNode: colorNode,
            hasWater: false
        })
    
        // Received shadow position
        const shadowOffset = uniform(0.25)
        this.material.receivedShadowPositionNode = positionLocal.add(this.game.lighting.directionUniform.mul(shadowOffset))

        // Position
        const wind = this.game.wind.offsetNode(positionLocal.xz)
        const multiplier = positionLocal.y.clamp(0, 1).mul(1)

        this.material.positionNode = Fn( ( { object } ) =>
        {
            instance(object.count, this.instanceMatrix).toStack()

            return positionLocal.add(vec3(wind.x, 0, wind.y).mul(multiplier))
        })()
    }

    setInstancedMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = - 0.25
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.mesh.count = this.transformMatrices.length
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)

        this.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(this.mesh.count * 16), 16)
        this.instanceMatrix.setUsage(THREE.StaticDrawUsage)

        // this.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(this.mesh.count * 3), 16)
        // this.instanceMatrix.setUsage(THREE.StaticDrawUsage)

        this.instanceColorIndex = new THREE.InstancedBufferAttribute(new Float32Array(this.colorIndices), 1)
        this.instanceColorIndex.setUsage(THREE.StaticDrawUsage)
        
        let i = 0
        for(const _transformMatrix of this.transformMatrices)
        {
            _transformMatrix.toArray(this.instanceMatrix.array, i * 16)
            i++
        }
    }
}