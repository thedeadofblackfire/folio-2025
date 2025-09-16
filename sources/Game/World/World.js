import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Field } from './Field.js'
import { Grid } from './Grid.js'
import { Grass } from './Grass.js'
import { color, float, Fn, instance, normalWorld, positionLocal, texture, vec3, vec4 } from 'three/tsl'
import { WaterSurface } from './WaterSurface.js'
import { Scenery } from './Scenery.js'
import { WindLines } from './WindLines.js'
import { Leaves } from './Leaves.js'
import { Lightnings } from './Lightnings.js'
import { Rain } from './Rain.js'
import { Snow } from './Snow.js'
import { Whispers } from './Whispers.js'
import { VisualVehicle } from './VisualVehicle.js'
import { Tornado } from './Tornado.js'
import { Easter } from '../Easter.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class World
{
    constructor()
    {
        this.game = Game.getInstance()

        this.visualVehicle = new VisualVehicle()
        this.field = new Field()
        // this.grid = new Grid()
        this.waterSurface = new WaterSurface()
        this.grass = new Grass()
        this.windLines = new WindLines()
        this.leaves = new Leaves()
        this.rainSnow = new Rain()
        this.lightnings = new Lightnings()
        this.snow = new Snow()
        this.whispers = new Whispers()
        this.tornado = new Tornado()
        this.scenery = new Scenery()

        // this.easter = new Easter()

        // this.setAxesHelper()
        // this.setCollisionGroupsTest()
        // this.setNormalTest()
        // this.setTestMesh()
        // this.setTestInstances()
    }

    setTestInstances()
    {
        // Geometry
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

        // Material
        const material = new THREE.MeshLambertNodeMaterial()
        material.castShadowNode = vec4(0, 1, 1, 1)

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = 2
        mesh.receiveShadow = true
        mesh.castShadow = true
        this.game.scene.add(mesh)

        // for(let i = 0; i < count; i++)
        // {
        //     const object = new THREE.Object3D()
            
        //     object.position.set(i * 2, 2, 0)
        //     object.updateMatrix()

        //     mesh.setMatrixAt(i, object.matrix)
        // }
    }

    setTestShadow()
    {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshLambertNodeMaterial(),
        )
        floor.receiveShadow = true
        floor.position.set(0, 0.5, 0)
        floor.rotation.x = - Math.PI * 0.5
        this.game.scene.add(floor)

        const material = new THREE.MeshLambertNodeMaterial({
            alphaMap: this.game.resources.foliageTexture,
            transparent: true
        })
        material.positionNode = Fn( ( { object } ) =>
        {
            instance(object.count, instanceMatrix).toStack()
            return positionLocal
        })()

        const geometry = new THREE.BoxGeometry(1, 1, 1)

        // const mesh = new THREE.Mesh(geometry, material)
        // mesh.receiveShadow = true
        // mesh.castShadow = true
        // mesh.count = 1
        // this.game.scene.add(mesh)

        // const instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count * 16), 16)
        // instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        
        // const matrix = new THREE.Matrix4().makeTranslation(new THREE.Vector3(0, 2, 0))
        // matrix.toArray(instanceMatrix.array, 0)

        const dummy = new THREE.Mesh(
            geometry,
            new THREE.MeshLambertNodeMaterial({
                alphaMap: this.game.resources.foliageTexture,
                transparent: true
            }),
        )
        dummy.receiveShadow = true
        dummy.castShadow = true
        dummy.position.set(0, 2, 3)
        this.game.scene.add(dummy)
    }

    setTestMesh()
    {
        const testMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new MeshDefaultMaterial({
                alphaNode: texture(this.game.resources.foliageTexture).r,
                colorNode: color(0xff0000),
                hasCoreShadows: true,
                hasDropShadows: true,
                transparent: true
            })
        )
        testMesh.receiveShadow = true
        testMesh.position.z = 3
        this.game.scene.add(testMesh)

        const testMesh2 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new MeshDefaultMaterial({
                colorNode: color(0xffffff),
                hasCoreShadows: true,
                hasDropShadows: true,
            })
        )
        testMesh2.receiveShadow = true
        testMesh2.position.x = 3
        this.game.scene.add(testMesh2)
    }

    setAxesHelper()
    {
        const axesHelper = new THREE.AxesHelper()
        axesHelper.position.y = 0.1
        this.game.scene.add(axesHelper)
    }

    setCollisionGroupsTest()
    {
        // // Left (object)
        // this.game.objects.add(
        //     {
        //         type: 'dynamic',
        //         position: { x: 4, y: 2, z: 0.1 },
        //         colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'object' } ]
        //     }
        // )

        // Right (terrain)
        this.game.objects.add(
            null,
            {
                type: 'dynamic',
                position: { x: 4, y: 2, z: -1.1 },
                colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'floor' } ]
            }
        )

        // // Top (bumper)
        // this.game.objects.add(
        //     {
        //         type: 'dynamic',
        //         position: { x: 4, y: 4, z: -0.5 },
        //         colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'bumper' } ]
        //     }
        // )
    }

    // setNormalTest()
    // {
    //     const geometry = new THREE.IcosahedronGeometry(1, 2)

    //     const material = new THREE.MeshLambertNodeMaterial()

    //     material.normalNode = normalView
    //     // const newNormal = 
    //     // material.normalNode = vec3(0, 1, 0)

    //     // material.positionNode = Fn(() =>
    //     // {
    //     //     // materialNormal.assign(vec3(0, 1, 0))
    //     //     return positionGeometry
    //     // })()
    //     material.outputNode = vec4(transformedNormalWorld, 1)

    //     const mesh = new THREE.Mesh(geometry, material)
    //     mesh.position.y = 2

    //     this.game.scene.add(mesh)
    // }
}