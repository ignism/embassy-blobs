import Matter from 'matter-js'

const engine = Matter.Engine.create()
engine.world.gravity.y = 0

export { engine }
