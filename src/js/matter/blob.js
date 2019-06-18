import Matter from 'matter-js'

let Smoothed = function (current, dest, smoothing)
{
    let step = (dest - current) / (dest * smoothing)
    return current + step
}

class Blob {
  constructor(position, num, size, radius) {
    this.position = position
    this.num = num
    this.size = size
    this.radius = radius
    this.bodies = []
    this.springs = []
  }

  init() {
    let frictionOptions = {
      friction: 0.1,
      frictionAir: 0.5,
      frictionStatic: 0.01
    }

    for (let i = 0; i < this.num; i++) {
      let angle = i / this.num * Math.PI * 2
      let offset = {
        x: Math.cos(angle) * this.radius,
        y: Math.sin(angle) * this.radius
      }

      let x = this.position.x + offset.x
      let y = this.position.y + offset.y
      let circle = Matter.Bodies.circle(x, y, this.size, frictionOptions)

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
        stiffness: 0.01,
        damping: 0.1,
        render: {
          type: 'line'
        }
      })

      let constraintAC = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyC,
        stiffness: 0.01,
        damping: 0.001,
        render: {
          type: 'line'
        }
      })

      let springAB = {
        constraint: constraintAB,
        restLength: constraintAB.length,
        growLength: constraintAB.length * 10
      }

      let springAC = {
        constraint: constraintAC,
        restLength: constraintAC.length,
        growLength: constraintAC.length * 10
      }

      this.springs.push(springAB)
      this.springs.push(springAC)
    }
  }

  getCenter() {
    let center = Matter.Vector.create()

    this.bodies.forEach(body => {
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
  }

  grow() {
    this.bodies.forEach((body) => {
      Matter.Body.scale(body, 1.1, 1.1)
    })
    this.springs.forEach((spring) => {
      let incr = Math.random() * 0.1 + 1.1
      spring.constraint.length = spring.constraint.length * incr;
    })
  }

  shrink() {
    this.bodies.forEach((body) => {
      Matter.Body.scale(body, 1/1.1, 1/1.1)
    })
    this.springs.forEach((spring) => {
      let decr = Math.random() * 0.1 + 1.1
      spring.constraint.length = spring.constraint.length / decr;
    })
  }
}

export default Blob
