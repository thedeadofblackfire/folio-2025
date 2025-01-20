import { Game } from './Game.js'
import gsap from 'gsap'

export class Time
{
    constructor()
    {
        this.game = Game.getInstance()

        this._scale = 2
        this.game.ticker.scale = this.scale
        gsap.globalTimeline.timeScale(this.scale)

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '⏱️ Time',
                expanded: false,
            })
            this.debugPanel
                .addBinding(this, 'scale', { min: 0, max: 5, step: 0.01 })
        }
    }

    set scale(value)
    {
        this._scale = value
        this.game.ticker.scale = this.scale
        gsap.globalTimeline.timeScale(value)
    }

    get scale()
    {
        return this._scale
    }
}