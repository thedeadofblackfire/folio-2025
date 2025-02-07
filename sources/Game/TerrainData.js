import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import MeshGridMaterial, { MeshGridMaterialLine } from './Materials/MeshGridMaterial.js'
import { color, Fn, mix, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl'

export class TerrainData
{
    constructor()
    {
        this.game = Game.getInstance()

        this.subdivision = 256
        this.geometry = this.game.resources.terrainModel.scene.children[0].geometry
        // this.geometry = new THREE.PlaneGeometry(this.subdivision, this.subdivision).rotateX(-Math.PI * 0.5)

        this.setNodes()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)
    }

    setNodes()
    {
        this.grassColorUniform = uniform(color('#9eaf33'))
        this.dirtColorUniform = uniform(color('#ffb869'))
        this.waterSurfaceColorUniform = uniform(color('#5dc278'))
        this.waterDepthColorUniform = uniform(color('#1b3e52'))
        this.groundDataDelta = uniform(vec2(0))

        this.worldPositionToUvNode = Fn(([position]) =>
        {
            const terrainUv = position.div(this.subdivision).add(0.5).toVar()
            return terrainUv
        })

        this.terrainDataNode = Fn(([position]) =>
        {
            const textureUv = this.worldPositionToUvNode(position)
            const data = texture(this.game.resources.terrainTexture, textureUv)

            // Wheel tracks
            const groundDataColor = texture(
                this.game.groundData.renderTarget.texture,
                position.sub(- this.game.groundData.halfSize).sub(this.groundDataDelta).div(this.game.groundData.size)
            )
            data.g.mulAssign(groundDataColor.r.oneMinus())

            return data
        })
        
        this.colorNode = Fn(([terrainData]) =>
        {
            // Dirt
            const baseColor = color(this.dirtColorUniform).toVar()

            // Grass
            baseColor.assign(mix(baseColor, this.grassColorUniform, terrainData.g))

            // Water
            baseColor.assign(mix(baseColor, this.waterSurfaceColorUniform, smoothstep(0, 0.3, terrainData.b)))
            baseColor.assign(mix(baseColor, this.waterDepthColorUniform, smoothstep(0.3, 1, terrainData.b)))

            return baseColor.rgb
        })

        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '🏔️ Terrain Data',
                expanded: false,
            })

            this.game.debug.addThreeColorBinding(debugPanel, this.grassColorUniform.value, 'grassColor')
            this.game.debug.addThreeColorBinding(debugPanel, this.dirtColorUniform.value, 'dirtColorUniform')
            this.game.debug.addThreeColorBinding(debugPanel, this.waterSurfaceColorUniform.value, 'waterSurfaceColorUniform')
            this.game.debug.addThreeColorBinding(debugPanel, this.waterDepthColorUniform.value, 'waterDepthColorUniform')
        }
    }
    
    update()
    {
        // Ground data delta
        this.groundDataDelta.value.set(
            this.game.groundData.focusPoint.x,
            this.game.groundData.focusPoint.y
        )
    }
}