import Matter from 'matter-js'
import inside from 'point-in-polygon'

let Smoothed = function(current, dest, smoothing) {
  let step = (dest - current) / (dest * smoothing)
  return current + step
}

class Blob {
  constructor(position, num, restScale, dishSize, dishOrigin) {
    this.position = position
    this.num = num
    this.size = 2.75
    this.radius = restScale * 24
    this.currScale = 1
    this.destScale = 1
    // this.restScale = radius / 24
    this.restScale = restScale
    this.bodies = []
    this.springs = []
    this.state = 0
    this.anchor
    this.dishSize = dishSize
    this.dishOrigin = dishOrigin
  }

  init() {
    this.currScale = 1
    let initSize = this.size * this.currScale
    let initRadius = 24 * this.currScale

    let frictionOptions = {
      friction: 0.8,
      frictionAir: 0.1,
      frictionStatic: 0.1,
      density: 0.1,
      restitution: 0
    }

    let circumConstraint = {
      stiffness: 0.025,
      damping: 0.1
    }

    let anchorConstraint = {
      stiffness: 0.000125,
      damping: 0.001
    }

    this.anchor = Matter.Bodies.polygon(
      this.position.x,
      this.position.y,
      12,
      initSize * 4,
      frictionOptions
    )

    for (let i = 0; i < this.num; i++) {
      let angle = i / this.num * Math.PI * 2
      let offset = {
        x: Math.cos(angle) * initRadius,
        y: Math.sin(angle) * initRadius
      }

      let x = this.position.x + offset.x
      let y = this.position.y + offset.y
      let circle = Matter.Bodies.polygon(x, y, 12, initSize, frictionOptions)

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
        stiffness: circumConstraint.stiffness,
        damping: circumConstraint.damping,
        render: {
          type: 'line'
        }
      })

      let constraintAC = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyC,
        stiffness: circumConstraint.stiffness,
        damping: circumConstraint.damping,
        render: {
          type: 'line'
        }
      })

      let constraintAnchorA = Matter.Constraint.create({
        bodyA: this.anchor,
        bodyB: bodyA,
        stiffness: anchorConstraint.stiffness,
        damping: anchorConstraint.damping,
        render: {
          type: 'line'
        }
      })

      let springAB = {
        constraint: constraintAB,
        restLength: constraintAB.length
      }

      let springAC = {
        constraint: constraintAC,
        restLength: constraintAC.length
      }

      let springAnchorA = {
        constraint: constraintAnchorA,
        restLength: constraintAnchorA.length
      }

      this.springs.push(springAB)
      this.springs.push(springAC)
      this.springs.push(springAnchorA)
    }
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

  update() {
    switch (this.state) {
      case 0:
        // init state
        this.destScale = this.restScale
        if (this.currScale < (this.restScale - 0.01)) {
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
        // reset state
        this.destScale = this.restScale

        if (this.currScale < this.destScale) {
          this.grow()
        } else if (this.currScale > this.destScale) {
          this.shrink()
        } else {
          this.springs.forEach((spring) => {
            // spring.constraint.length = spring.restLength
          })

          this.state = 1
        }
        break
      case 20:
        // grow state
        if (this.currScale < this.destScale) {
          this.grow(400)
        } else {
          this.state = 1
        }
        break
      case 21:
        // shrink state
        if (this.currScale > this.destScale) {
          this.shrink(600)
        } else {
          this.state = 1
        }
        break
    }
  }

  reset() {
    this.destScale = this.restScale
    this.isMouseOver = false

    if (this.currScale < this.destScale) {
      this.state = 20
    } else {
      this.state = 21
    }
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

  scaleTo(multiplier) {
    this.destScale = multiplier

    if (this.destScale > this.currScale) {
      this.state = 20
    } else if (this.destScale < this.currScale) {
      this.state = 21
    }
  }

  scale(amount) {
    this.currScale *= amount 

    this.springs.forEach((spring) => {
      spring.constraint.length *= amount
    })
    this.bodies.forEach((body) => {
      Matter.Body.scale(body, amount, amount)
    })

    Matter.Body.scale(this.anchor, amount, amount)
  }

  resize(scale) {
    this.restScale = this.restScale * scale
    this.scaleTo(this.restScale)
  }

  grow(strength = 100) {
    // let amount = strength
    let diff = this.destScale - this.currScale
    let amount = 1 + (diff / strength)


    this.scale(amount)
  }

  shrink(strength = 100) {
    // let amount = 1 / strength

    let diff = this.destScale - this.currScale
    let amount = 1 + (diff / strength)

    this.scale(amount)
  }

  // moveTo(position) {
  //   let strength = 0.01
  //   let offset = Matter.Vector.sub(this.getCenter(), position)
  //   let force = Matter.Vector.mult(
  //     Matter.Vector.normalise(offset),
  //     strength
  //   )
  //   Matter.Body.applyForce(this.anchor, Matter.Vector.create(), force)
  // }

  // addForce(point, strength = 0.002) {
  //   this.bodies.forEach((body) => {
  //     let distance = Matter.Vector.sub(body.position, point)
  //     let force = Matter.Vector.mult(
  //       Matter.Vector.normalise(distance),
  //       strength
  //     )
  //     Matter.Body.applyForce(body, Matter.Vector.create(), force)
  //   })
  // }

  addMovement(center, strength) {
    let norm = Matter.Vector.normalise(
      Matter.Vector.sub(center, this.anchor.position)
    )
    let perpendicular = Matter.Vector.rotate(
      // norm, Math.PI * 0.5 * ((Math.random() - 0.5) * 0.1 + 1)
      norm, Math.PI * ((Math.random() > 0.5) ? 1 : -1) * 0.5
    )
    let force = Matter.Vector.mult(perpendicular, strength * this.currScale)

    Matter.Body.applyForce(this.anchor, this.anchor.position, force)
  }

  isInside(point) {
    let polygon = []

    this.bodies.forEach((body) => {
      let position = [body.position.x, body.position.y]
      polygon.push(position)
    })

    return inside([point.x, point.y], polygon)
  }

  keepInsideDish() {
    this.bodies.forEach(body => {
      let distance = Matter.Vector.sub(body.position, this.dishOrigin)
      let offset = Matter.Vector.magnitude(distance)
      
      if (offset > this.dishSize) {
        console.log('keep ' + this.dishSize)
        console.log('offset ' + offset)
        let direction = Matter.Vector.normalise(distance)
        let newPosition = Matter.Vector.mult(direction, (this.dishSize - 10))
        Matter.Body.setPosition(body, newPosition)
      }
    })
  }
}

export default Blob
