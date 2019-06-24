import Matter from 'matter-js'
import inside from 'point-in-polygon'

let Smoothed = function(current, dest, smoothing) {
  let step = (dest - current) / (dest * smoothing)
  return current + step
}

class Blob {
  constructor(position, num, size, radius) {
    this.position = position
    this.num = num
    this.size = size
    this.radius = radius
    this.currScale = 0.5
    this.destScale = 1
    this.bodies = []
    this.springs = []
    this.state = 0
    this.anchor
  }

  init() {
    this.currScale = 0.5
    let initSize = this.size * this.currScale
    let initRadius = this.radius * this.currScale

    let frictionOptions = {
      friction: 0.1,
      frictionAir: 0.5,
      frictionStatic: 0.01
    }

    let constraintOptions = {
      stiffness: 0.05,
      damping: 0.5
    }

    this.anchor = Matter.Bodies.circle(this.position.x, this.position.y, initSize, frictionOptions)

    for (let i = 0; i < this.num; i++) {
      let angle = i / this.num * Math.PI * 2
      let offset = {
        x: Math.cos(angle) * initRadius,
        y: Math.sin(angle) * initRadius
      }

      let x = this.position.x + offset.x
      let y = this.position.y + offset.y
      let circle = Matter.Bodies.circle(x, y, initSize, frictionOptions)

      this.bodies.push(circle)
    }

    for (let i = 0; i < this.num; i++) {
      let j = (i + 1) % this.num
      let k = (i + 2) % this.num

      let bodyA = this.bodies[i]
      let bodyB = this.bodies[j]
      let bodyC = this.bodies[k]

      let constraintAB = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
        stiffness: constraintOptions.stiffness,
        damping: constraintOptions.damping,
        render: {
          type: 'line'
        }
      })

      let constraintAC = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyC,
        stiffness: constraintOptions.stiffness,
        damping: constraintOptions.damping,
        render: {
          type: 'line'
        }
      })

      let springAB = {
        constraint: constraintAB,
        restLength: constraintAB.length,
        currLength: constraintAB.length,
        destLength: constraintAB.length
      }

      let springAC = {
        constraint: constraintAC,
        restLength: constraintAC.length,
        currLength: constraintAC.length,
        destLength: constraintAC.length
      }

      this.springs.push(springAB)
      this.springs.push(springAC)
    }
  }

  update() {
    switch (this.state) {
      case 0:
        // init state
        if (this.currScale < 1) {
          this.grow()
        } else {
          this.springs.forEach((spring) => {
            spring.restLength = spring.constraint.length
          })
          this.state++
        }
        break
      case 1:
        // rest state
        break
      case 10:
        if (this.currScale < 1) {
          this.state = 20
        } else if (this.currScale > 1) {
          this.state = 21
        } else {
          this.state = 1
        }
        break
      case 20:
        // grow state
        if (this.currScale < this.destScale) {
          this.grow()

          if (this.isMouseOver) {
            console.log('applying force')
            this.addForce(this.getCenter())
          }
        } else if (this.isMouseOver) {
            console.log('applying force')
            this.addForce(this.getCenter())
        } else {
          this.state = 1
        }
        break
      case 21:
        // shrink state
        if (this.currScale > this.destScale) {
          this.shrink()
        } else {
          this.state = 1
        }
        break
    }
  }

  scale(multiplier) {
    this.destScale = multiplier

    if (this.destScale > this.currScale) {
      this.state = 20
    } else if (this.destScale < this.currScale) {
      this.state = 21
    }
  }

  reset() {
    this.destScale = 1
    this.isMouseOver = false
    this.state = 10
  }

  getCenter() {
    let center = Matter.Vector.create()

    this.bodies.forEach((body) => {
      center.x += body.position.x
      center.y += body.position.y
    })

    center.x /= this.num
    center.y /= this.num

    return center
  }

  addToWorld(world) {
    this.bodies.forEach((body) => {
      Matter.World.add(world, body)
    })

    this.springs.forEach((spring) => {
      Matter.World.add(world, spring.constraint)
    })

    Matter.World.add(world, this.anchor)
  }

  grow() {
    let amount = 1.009
    this.currScale *= amount

    this.springs.forEach((spring) => {
      spring.constraint.length *= amount
    })
    this.bodies.forEach((body) => {
      Matter.Body.scale(body, amount, amount)
    })
  }

  shrink() {
    let amount = 1 / 1.005
    this.currScale *= amount

    this.springs.forEach((spring) => {
      spring.constraint.length *= amount
    })
    this.bodies.forEach((body) => {
      Matter.Body.scale(body, amount, amount)
    })
  }

  addForce(point) {
    this.bodies.forEach(body => {
      let distance = Matter.Vector.sub(body.position, point)
      let force = Matter.Vector.mult(Matter.Vector.normalise(distance), 0.002)
      Matter.Body.applyForce(body, Matter.Vector.create(), force)
    })
  }

  isInside(vector) {
    let polygon = []

    this.bodies.forEach((body) => {
      let position = [body.position.x, body.position.y]
      polygon.push(position)
    })

    return inside([vector.x, vector.y], polygon)
  }
}

export default Blob
