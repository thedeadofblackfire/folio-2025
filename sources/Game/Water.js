import { uniform } from 'three/tsl'
import { Game } from './Game.js'

export class Water
{
    constructor()
    {
        this.game = Game.getInstance()

        this.elevation = uniform(-0.3)
        this.amplitude = uniform(0.013)

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '💧 Water',
                expanded: false,
            })
            debugPanel.addBinding(this.elevation, 'value', { label: 'elevation', min: -1, max: 0, step: 0.001 })
            debugPanel.addBinding(this.amplitude, 'value', { label: 'amplitude', min: 0, max: 0.5, step: 0.001 })
        }
    }
}