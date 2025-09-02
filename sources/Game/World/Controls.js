import { Game } from '../Game.js'
import { Inputs } from '../Inputs/Inputs.js'
import { InteractivePoints } from '../InteractivePoints.js'
import { Modals } from '../Modals.js'

export class Controls
{
    constructor(references)
    {
        this.game = Game.getInstance()
        
        this.references = references

        this.setModal()
        this.setInteractiveArea()
    }

    setModal()
    {
        this.modal = {}
        this.modal.instance = this.game.modals.items.get('controls')

        this.modal.instance.events.on('close', () =>
        {
            this.interactiveArea.reveal()
        })

        this.modal.instance.events.on('open', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                this.modal.instance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                this.modal.instance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                this.modal.instance.tabs.goTo('touch')
        })
    }

    setInteractiveArea()
    {
        this.interactiveArea = this.game.interactivePoints.create(
            this.references.get('interactiveArea')[0].position,
            'Controls',
            InteractivePoints.ALIGN_RIGHT,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('controls')
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