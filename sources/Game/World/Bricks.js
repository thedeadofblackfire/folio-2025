import { Game } from '../Game.js'
import { InstancedGroup } from '../InstancedGroup.js'

export class Bricks
{
    constructor()
    {
        this.game = Game.getInstance()

        // References
        const references = InstancedGroup.getReferencesFromChildren(this.game.resources.bricksReferencesModel.scene.children)
        
        for(const reference of references)
        {
            this.game.objects.add(
                {
                    model: reference,
                    updateMaterials: false,
                    castShadow: false,
                    receiveShadow: false,
                    parent: null,
                },
                {
                    type: 'dynamic',
                    position: reference.position,
                    rotation: reference.quaternion,
                    friction: 0.7,
                    mass: 0.1,
                    sleeping: true,
                    colliders: [ { shape: 'cuboid', parameters: [ 0.75 * 0.75, 0.5 * 0.75, 1 * 0.75 ], category: 'object' } ],
                    waterGravityMultiplier: - 1
                },
            )
        }

        // Model
        const model = this.game.resources.bricksVisualModel.scene.children[0]
        model.position.set(0, 0, 0)
        model.rotation.set(0, 0, 0)
        model.frustumCulled = false

        this.game.objects.add(
            {
                model: model,
                parent: null
            },
            null
        )
        // model.removeFromParent()

        // Instanced group
        this.testInstancedGroup = new InstancedGroup(references, model, true)
    }
}