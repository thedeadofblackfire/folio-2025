import { Game } from '../Game.js'

export class Playground
{
    constructor()
    {
        this.game = Game.getInstance()

        this.game.objects.addFromModels(
            this.game.resources.playgroundPhysical.scene,
            this.game.resources.playgroundVisual.scene,
            {
                type: 'fixed',
                friction: 0,
                collidersOverwrite: { category: 'floor' }
            }
        )
    }
}