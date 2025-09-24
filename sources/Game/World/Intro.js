import { Game } from '../Game.js'
import { InteractivePoints } from '../InteractivePoints.js'

export class Intro
{
    constructor(references)
    {
        this.game = Game.getInstance()
        
        this.references = references

        this.setInteractiveArea()

        let firstTimeIntro = true

        this.game.modals.items.get('intro').events.on('close', () =>
        {
            if(firstTimeIntro)
                this.game.audio?.music.play()
            
            firstTimeIntro = false
            this.interactiveArea.reveal()
        })
    }

    setInteractiveArea()
    {
        this.interactiveArea = this.game.interactivePoints.create(
            this.references.get('interactiveArea')[0].position,
            'Read me!',
            InteractivePoints.ALIGN_RIGHT,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('intro')
                this.interactiveArea.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }
}