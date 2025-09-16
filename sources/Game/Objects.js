import { Game } from './Game.js'

export class Objects
{
    constructor()
    {
        this.game = Game.getInstance()
        this.list = new Map()
        this.key = 0

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 3)
    }

    add(_visualDescription = null, _physicalDescription = null)
    {
        const object = { visual: null, physical: null }

        /**
         * Visual
         */
        if(_visualDescription && _visualDescription.model)
        {
            object.visual = _visualDescription.model

            // Default parameters
            const visualDescription = {
                updateMaterials: true,
                castShadow: true,
                receiveShadow: true,
                parent: this.game.scene,
                ..._visualDescription
            }
            
            // Update materials
            if(visualDescription.updateMaterials)
                this.game.materials.updateObject(visualDescription.model)

            // Update shadows
            if(visualDescription.castShadow || visualDescription.receiveShadow)
            {
                visualDescription.model.traverse(_child =>
                {
                    if(_child.isMesh)
                    {
                        if(visualDescription.castShadow)
                            _child.castShadow = true

                        if(visualDescription.receiveShadow)
                            _child.receiveShadow = true
                    }
                })
            }

            // Add to scene
            if(visualDescription.parent !== null)
                visualDescription.parent.add(object.visual)
        }

        /**
         * Physical
         */
        if(_physicalDescription)
        {
            object.physical = this.game.physics.getPhysical(_physicalDescription)
        }

        /**
         * Save
         */
        this.key++
        this.list.set(this.key, object)

        // If sleeping, not enabled or fixed apply transform directly
        if(object.visual && object.physical)
        {
            if(_physicalDescription.sleeping || !_physicalDescription.enabled || object.physical.type === 'fixed')
            {
                object.visual.position.copy(object.physical.body.translation())
                object.visual.quaternion.copy(object.physical.body.rotation())
            }
        }

        return object
    }

    addFromModel(_model, _visualDescription = {}, _physicalDescription = {})
    {
        // Extract physical from direct children and remove from scene
        const physical = _model.children.find(_child => _child.name.startsWith('physical'))

        // Create collider from physical children names and scales
        const colliders = []
        if(physical)
        {
            physical.removeFromParent()
            
            if(typeof _physicalDescription.type === 'undefined')
            {
                _physicalDescription.type = physical.name.match(/dynamic/i) ? 'dynamic' : 'fixed'
            }

            for(const _physical of physical.children)
            {
                let collidersOverwrite = {}
                if(typeof _physicalDescription.collidersOverwrite !== 'undefined')
                    collidersOverwrite = _physicalDescription.collidersOverwrite

                const collider = {
                    position: _physical.position,
                    quaternion: _physical.quaternion,
                    ...collidersOverwrite
                }
                if(_physical.name.match(/^trimesh/i))
                {
                    collider.shape = 'trimesh'
                    collider.parameters = [ _physical.geometry.attributes.position.array, _physical.geometry.index.array ]
                }
                else if(_physical.name.match(/^hull/i))
                {
                    collider.shape = 'hull'
                    collider.parameters = [ _physical.geometry.attributes.position.array, _physical.geometry.index.array ]
                }
                else if(_physical.name.match(/^cub/i))
                {
                    collider.shape = 'cuboid'
                    collider.parameters = [ _physical.scale.x * 0.5, _physical.scale.y * 0.5, _physical.scale.z * 0.5 ]
                }
                else if(_physical.name.match(/^cylinder/i))
                {
                    collider.shape = 'cylinder'
                    collider.parameters = [ _physical.scale.y * 0.5, _physical.scale.x * 0.5 ]
                }
                else if(_physical.name.match(/^ball/i) || _physical.name.match(/^sphere/i))
                {
                    collider.shape = 'ball'
                    collider.parameters = [ _physical.scale.y * 0.5 ]
                }

                colliders.push(collider)
            }
        }
        
        // Add
        return this.add(
            { ..._visualDescription, model: _model },
            physical ? { ..._physicalDescription, colliders: colliders } : null
        )
    }

    reset()
    {
        this.list.forEach((object) =>
        {
            if(object.physical)
            {
                if(object.physical.type === 'dynamic')
                {
                    object.physical.body.setTranslation(object.physical.initialState.position)
                    object.physical.body.setRotation(object.physical.initialState.rotation)
                    object.physical.body.setLinvel({ x: 0, y: 0, z: 0 })
                    object.physical.body.setAngvel({ x: 0, y: 0, z: 0 })
                    
                    if(object.physical.initialState.sleeping)
                    {
                        requestAnimationFrame(() =>
                        {
                            object.physical.body.sleep()
                        })
                    }
                    
                    if(object.visual)
                    {
                        object.visual.position.copy(object.physical.initialState.position)
                        object.visual.quaternion.copy(object.physical.initialState.rotation)
                    }
                }
            }
        })
    }

    update()
    {
        this.list.forEach((_object) =>
        {
            if(_object.visual && _object.physical)
            {
                if(!_object.physical.body.isSleeping())
                {
                    _object.visual.position.copy(_object.physical.body.translation())
                    _object.visual.quaternion.copy(_object.physical.body.rotation())
                }
            }
        })
    }
}