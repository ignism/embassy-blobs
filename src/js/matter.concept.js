import Matter from 'matter-js'
// module aliases
let Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Constraint = Matter.Constraint,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint

// create an engine
let engine = Engine.create()

engine.world.gravity.y = 0

// create a renderer
let render = Render.create({
  element: document.getElementById('matter-app'),
  engine: engine
})

// render.options.wireframeBackground = 'transparent'
// render.options.background = 'transparent'
render.options.wireframes = true

// create two boxes and a ground
let ground = Bodies.rectangle(400, 610, 810, 60, {
  isStatic: true
})

let frictionOptions = {
  friction: 0.1,
  frictionAir: 0.9,
  frictionStatic: 0.01
}

let TWO_PI = Math.PI * 2.0
let centerX = render.options.width * 0.5
let centerY = render.options.height * 0.5
let num
let radius
let size
let circumfence
let anchored

num = 6
radius = 32.0
size = 16
circumfence = []
anchored = []

let anchor = Bodies.circle(centerX, centerY, size)
World.add(engine.world, anchor)

for (let i = 0; i < num; i++) {
  let angle = i / num * TWO_PI
  let offsetX = Math.cos(angle) * radius
  let offsetY = Math.sin(angle) * radius

  let x = centerX + offsetX
  let y = centerY + offsetY
  let circle = Bodies.circle(x, y, size, frictionOptions)

  anchored.push(circle)
  World.add(engine.world, circle)
}

for (let i = 0; i < num; i++) {
  let j = (i + 1) % num

  let bodyA = anchored[i]
  let bodyB = anchored[j]

  let constraint = Constraint.create({
    bodyA: bodyA,
    pointA: {
      x: 0,
      y: 0
    },
    bodyB: bodyB,
    pointB: {
      x: 0,
      y: 0
    },
    stiffness: 0.1,
    damping: 0.01,
    render: {}
  })

  let anchorConstraint = Constraint.create({
    bodyA: bodyA,
    pointA: {
      x: 0,
      y: 0
    },
    bodyB: anchor,
    pointB: {
      x: 0,
      y: 0
    },
    stiffness: 0.1,
    damping: 0.01
  })

  anchorConstraint.render.visible = false

  World.add(engine.world, constraint)
  World.add(engine.world, anchorConstraint)
}

num = 12
radius = 60.0
size = 12
circumfence = []

for (let i = 0; i < num; i++) {
  let angle = i / num * TWO_PI
  let offsetX = Math.cos(angle) * radius
  let offsetY = Math.sin(angle) * radius

  let x = centerX + offsetX
  let y = centerY + offsetY
  let circle = Bodies.circle(x, y, size, frictionOptions)

  World.add(engine.world, circle)
  circumfence.push(circle)
}

for (let i = 0; i < num; i++) {
  let j = (i + 1) % num
  let a = parseInt(Math.floor(i * 0.5))

  let bodyA = circumfence[i]
  let bodyB = circumfence[j]
  let bodyC = anchored[a]

  let constraint = Constraint.create({
    bodyA: bodyA,
    pointA: {
      x: 0,
      y: 0
    },
    bodyB: bodyB,
    pointB: {
      x: 0,
      y: 0
    },
    stiffness: 0.5,
    damping: 1
  })

  let constraintA = Constraint.create({
    bodyA: bodyA,
    pointA: {
      x: 0,
      y: 0
    },
    bodyB: bodyC,
    pointB: {
      x: 0,
      y: 0
    },
    stiffness: 0.5,
    damping: 1
  })

  World.add(engine.world, constraint)
  World.add(engine.world, constraintA)
}

let mouse = Mouse.create(render.canvas),
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.009,
      render: {
        visible: false
      }
    }
  })

World.add(engine.world, mouseConstraint)

// keep the mouse in sync with rendering
render.mouse = mouse

// run the engine
Engine.run(engine)

// run the renderer
Render.run(render)

//-----------------------------------------//

let path = document.getElementById('blob').querySelector('#path')

function renderToSVG() {
  // QUBIC
  // let v1 = Matter.Vector.create(circumfence[0].position.x, circumfence[0].position.y)
  // let v2 = Matter.Vector.create(circumfence[1].position.x, circumfence[1].position.y)
  // let center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  // let points = 'M' + center.x + ' ' + center.y + ' '

  // v1 = v2
  
  // for (let i = 1; i < circumfence.length; i++) {
  //   v2 = Matter.Vector.create(circumfence[i].position.x, circumfence[i].position.y)
  //   center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  //   points += 'Q' + v1.x + ' ' + v1.y + ' '
  //   points += center.x + ' ' + center.y + ' '

  //   v1 = v2
  // }

  // v2 = Matter.Vector.create(circumfence[0].position.x, circumfence[0].position.y)
  // center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  // points += 'Q' + v1.x + ' ' + v1.y  + ' '
  // points += center.x + ' ' + center.y + ' '

  // v1 = v2
  // v2 = Matter.Vector.create(circumfence[1].position.x, circumfence[1].position.y)
  // center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  // points += 'Q' + v1.x + ' ' + v1.y  + ' '
  // points += center.x + ' ' + center.y + ' '

  //- - - - - - - 

  // CONTROL POINTS
 
  let v1 = Matter.Vector.create(anchored[0].position.x, anchored[0].position.y)
  let v2 = Matter.Vector.create(anchored[1].position.x, anchored[1].position.y)
  let center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  let points = 'M' + center.x + ' ' + center.y + ' '
  
  v1 = v2

  for (let i = 2; i < anchored.length; i++) {
    v2 = Matter.Vector.create(anchored[i].position.x, anchored[i].position.y)
    center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

    points += 'Q' + v1.x + ' ' + v1.y
    points += ' ' + center.x + ' ' + center.y + ' '

    v1 = v2
  }

  v2 = Matter.Vector.create(anchored[0].position.x, anchored[0].position.y)
  center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  points += 'Q' + v1.x + ' ' + v1.y
  points += ' ' + center.x + ' ' + center.y + ' '

  v1 = v2

  v2 = Matter.Vector.create(anchored[1].position.x, anchored[1].position.y)
  center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

  points += 'Q' + v1.x + ' ' + v1.y
  points += ' ' + center.x + ' ' + center.y + ' '

  path.setAttribute('d', points)
  window.requestAnimationFrame(renderToSVG)
}

window.requestAnimationFrame(renderToSVG)
