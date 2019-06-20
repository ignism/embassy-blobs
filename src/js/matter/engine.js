import Matter from 'matter-js/build/matter.min.js'

const engine = Matter.Engine.create()
engine.world.gravity.y = 0

export { engine }