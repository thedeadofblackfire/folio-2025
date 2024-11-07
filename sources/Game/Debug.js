import { Pane } from 'tweakpane'
import Stats from 'stats-gl'
import { Game } from './Game.js'

export class Debug
{
    constructor()
    {
        this.game = new Game()
        
        this.active = location.hash.indexOf('debug') !== -1

        if(this.active)
        {
            this.setPanel()
            this.setStats()
        }
    }

    setPanel()
    {
        this.panel = new Pane()
    }

    setStats()
    {
        this.stats = new Stats({
            trackGPU: false,
            trackHz: true,
            logsPerSecond: 4,
            graphsPerSecond: 30,
            samplesLog: 40, 
            samplesGraph: 10, 
            precision: 2, 
            horizontal: true,
            minimal: false, 
            mode: 0
        })
        document.body.append(this.stats.dom)
    }
}