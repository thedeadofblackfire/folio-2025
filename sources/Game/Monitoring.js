import Stats from 'stats-gl'
import { Game } from './Game.js'

export class Monitoring
{
    constructor()
    {
        this.game = Game.getInstance()

        // No debug
        if(!this.game.debug.active)
            return

        // Stats
        this.stats = new Stats({
            trackGPU: true,
            trackHz: false,
            trackCPT: false,
            logsPerSecond: 4,
            graphsPerSecond: 30,
            samplesLog: 40, 
            samplesGraph: 10, 
            precision: 1, 
            horizontal: false,
            minimal: false, 
            mode: 0
        })

        this.stats.init(this.game.rendering.renderer)
        document.body.append(this.stats.dom)

        // Update
        this.game.ticker.events.on('tick', () =>
        {
            this.stats.update()
        }, 999)
    }
}