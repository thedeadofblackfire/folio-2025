import { Events } from './Events.js'
import { Game } from './Game.js'
import { Tabs } from './Tabs.js'

export class Menu
{
    static OPEN = 1
    static OPENING = 2
    static CLOSED = 3
    static CLOSING = 4
    
    constructor()
    {
        this.game = Game.getInstance()
        this.state = Menu.CLOSED
        this.element = document.querySelector('.js-menu')
        this.current = null
        // this.pending = null
        this.default = null
        this.events = new Events()

        this.setClose()
        // this.setNavigation()
        this.setItems()
        // this.preopen()
        
        this.element.addEventListener('transitionend', () =>
        {
            this.onTransitionEnded()
        })
    }

    onTransitionEnded()
    {
        if(this.state === Menu.OPENING)
        {
            this.state = Menu.OPEN
            this.events.trigger('opened')
            this.current.events.trigger('opened')
        }
        else if(this.state === Menu.CLOSING)
        {
            this.state = Menu.CLOSED
            this.events.trigger('closed')
            this.current.events.trigger('closed')
            
            // // Pending => Open pending
            // if(this.pending)
            // {
            //     this.open(this.pending)
            //     this.pending = null
            // }

            // // No pending => Fully hide
            // else
            // {
                this.element.classList.remove('is-displayed')
            // }
        }
    }

    setItems()
    {
        const navigationElement = this.element.querySelector('.js-navigation')
        const previewElement = this.element.querySelector('.js-previews')
        const contentElement = this.element.querySelector('.js-contents')
        this.items = new Map()

        const navigationElements = navigationElement.querySelectorAll('.js-navigation-item')
        const previewElements = [...previewElement.querySelectorAll('.js-preview')]
        const contentElements = [...contentElement.querySelectorAll('.js-content')]

        for(const navigationElement of navigationElements)
        {
            const item = {}
            item.navigationElement = navigationElement
            item.name = item.navigationElement.dataset.name
            item.previewElement = previewElements.find(element => element.classList.contains(item.name))
            item.contentElement = contentElements.find(element => element.classList.contains(item.name))
            item.isOpen = false
            item.events = new Events()

            // TODO: setup tabs
            
            // TODO: setup scroller
            
            // TODO: setup default (?)

            item.navigationElement.addEventListener('click', (event) =>
            {
                event.preventDefault()

                this.open(item.name)
            })

            this.items.set(item.name, item)
        }
    }

    setClose()
    {
        const closeElements = this.element.querySelectorAll('.js-close')

        for(const element of closeElements)
        {
            element.addEventListener('click', () =>
            {
                this.pending = null
                this.close()
            })
        }

        this.element.addEventListener('click', (event) =>
        {
            if(event.target === this.element)
                this.close()
        })
    }

    open(name = 'intro')
    {
        const item = this.items.get(name)

        // Not found
        if(!item)
            return

        // Same
        if(
            (this.state === Menu.OPEN || this.state === Menu.OPENING) &&
            item === this.current
        )
            return
        
        // Sound
        this.game.audio.groups.get('click').play(true)
        // console.log(this.game.audio.groups.get('click'))

        // Leaving item
        if(this.current)
        {
            this.current.navigationElement.classList.remove('is-active')
            this.current.previewElement.classList.remove('is-visible')
            this.current.contentElement.classList.remove('is-visible')
            
            this.current.isOpen = false
        }

        // Entering item
        item.navigationElement.classList.add('is-active')
        item.previewElement.classList.add('is-visible')
        item.contentElement.classList.add('is-visible')
        
        item.isOpen = true
        
        this.current = item
        
        // TODO: tabs
        // // Tabs resize
        // if(item.tabs)
        //     item.tabs.resize()

        // TODO: main focus
        // if(item.mainFocus)
        //     item.mainFocus.focus()

        // Input filters
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('modal') // TODO: change to "menu"

        // Events
        this.events.trigger('open')
        this.current.events.trigger('open')
        
        // Need open
        if(this.state === Menu.CLOSED)
        {
            this.state = Menu.OPENING

            this.element.classList.add('is-displayed')
            requestAnimationFrame(() =>
            {
                requestAnimationFrame(() =>
                {
                    this.element.classList.add('is-visible')
                })
            })
        }
    }

    close()
    {
        if(this.state === Menu.CLOSING || this.state === Menu.CLOSED)
            return

        // Sound
        this.game.audio.groups.get('click').play(false)

        this.element.classList.remove('is-visible')

        this.state = Menu.CLOSING
        this.events.trigger('close')
        this.current.isOpen = false
        this.current.events.trigger('close')
    }

    preopen()
    {
        if(this.game.debug.active)
            return

        this.items.forEach((item) => 
        {
            // Is preopened
            if(typeof item.element.dataset.preopen !== 'undefined')
            {
                this.open(item.name)               
            }
        })
    }
}