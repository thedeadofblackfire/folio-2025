import { uniform } from 'three/tsl'
import { Events } from './Events.js'
import { Game } from './Game.js'
import gsap from 'gsap'

export class Ticker
{
    constructor()
    {
        this.game = Game.getInstance()

        this.elapsed = 0
        this.delta = 1 / 60
        this.maxDelta = 1 / 30
        this.scale = 2
        this.deltaScaled = this.delta * this.scale
        this.elapsedScaled = 0

        this.elapsedUniform = uniform(this.elapsed)
        this.deltaUniform = uniform(this.delta)
        this.elapsedScaledUniform = uniform(this.elapsedScaled)
        this.deltaScaledUniform = uniform(this.deltaScaled)

        this.events = new Events()
        // this.setTick()
    }

    setTick()
    {
        const tick = (elapsed) =>
        {
            this.update(elapsed)

            requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }

    update(elapsed)
    {
        const elapsedSeconds = elapsed / 1000
        this.delta = Math.min(elapsedSeconds - this.elapsed, this.maxDelta)
        this.elapsed = elapsedSeconds
        this.deltaScaled = this.delta * this.scale
        this.elapsedScaled += this.deltaScaled

        this.elapsedUniform.value = this.elapsed
        this.deltaUniform.value = this.delta
        this.elapsedScaledUniform.value = this.elapsedScaled
        this.deltaScaledUniform.value = this.deltaScaled

        this.events.trigger('tick')
    }
}