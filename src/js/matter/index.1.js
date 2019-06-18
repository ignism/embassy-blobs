import Matter from 'matter-js'
import { engine } from './engine'
import { CanvasRender } from './render'
import { Blob } from './blob'
import _ from 'lodash'
import { Dish } from './dish';

// const render = Matter.Render.create({
//   element: document.getElementById('matter-app'),
//   engine: engine
// })

let wrapper = document.getElementById('matter-app')

let dish = new Dish(wrapper.clientWidth * 0.5, wrapper.clientHeight * 0.5, 24, 240)
dish.init()
dish.addToWorld(engine.world)

let blob = new Blob(wrapper.clientWidth / 2 - 100, wrapper.clientHeight / 2 - 100, 12, 12, 48)
blob.init()
blob.addToWorld(engine.world)

let blobB = new Blob(wrapper.clientWidth / 2 + 100, wrapper.clientHeight / 2 + 100, 12, 12, 48)
blobB.init()
blobB.addToWorld(engine.world)

let canvasRender = new CanvasRender(wrapper, engine)
canvasRender.init()

let mouse = Matter.Mouse.create(canvasRender.render.canvas),
  mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.009,
      render: {
        visible: false
      }
    }
  })

Matter.World.add(engine.world, mouseConstraint)

// keep the mouse in sync with rendering
canvasRender.render.mouse = mouse

window.addEventListener('resize', _.throttle(event => {
  canvasRender.resize()
  
  let wrapperCenter = Matter.Vector.create(wrapper.clientWidth * 0.5, wrapper.clientHeight * 0.5)
  dish.moveTo(wrapperCenter)
}, 200))

window.addEventListener('click', (event) => {
  // blob.grow()
})

window.addEventListener('keypress', (event) => {
  event.preventDefault()

  if (event.key == 'z') {
    blob.grow()
  }
  if (event.key == 'x') {
    blob.shrink()
  }
})

window.addEventListener('mousemove', _.throttle((event) => {
  let distance = 99999
  let blobIndex = 'none'

  let distA = Matter.Vector.magnitude(
    Matter.Vector.sub(mouse.position, blob.getCenter())
  )
  let distB = Matter.Vector.magnitude(
    Matter.Vector.sub(mouse.position, blobB.getCenter())
  )

  if (distA < distance) {
    distance = distA
    if (distance < blob.radius) {
      blobIndex = 'A'
    }
  }

  if (distB < distance) {
    distance = distB
    if (distance < blobB.radius) {
      blobIndex = 'B'
    }
  }

  console.log(blobIndex)
}, 500))

Matter.Engine.run(engine)
Matter.Render.run(canvasRender.render)
