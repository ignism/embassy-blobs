import Matter from 'matter-js'
import inside from 'point-in-polygon'

let Smoothed = function(current, dest, smoothing) {
  let step = (dest - current) / (dest * smoothing)
  return current + step
}

class Blob {
  constructor(position, num, restScale, dishSize, dishOrigin) {
    this.position = position
    this.num = 20
    this.size = 3.75
    this.radius = restScale * 24
    this.currScale = 1
    this.destScale = 1
    // this.restScale = radius / 24
    this.restScale = restScale
    this.bodies = []
    this.springs = []
    this.anchorSprings = []
    this.state = 0
    this.anchor
    this.dishSize = dishSize
    this.dishOrigin = dishOrigin
    this.isRotating = false
    this.dirRotation = false
    this.currRotation = 0
    this.targetRotation = 0
    this.isTight = false
    this.initialized = false
  }

  init() {
    this.currScale = 1
    let initSize = this.size * this.currScale
    let initRadius = 24 * this.currScale

    let frictionOptions = {
      friction: 0.08,
      frictionAir: 0.125,
      frictionStatic: 0.01,
      density: 0.1,
      restitution: 0
    }

    let circumConstraint = {
      stiffness: 0.125,
      damping: 0.1
    }

    let anchorConstraint = {
      stiffness: 0.0125,
      damping: 0.000001
    }

    this.anchor = Matter.Bodies.polygon(
      this.position.x,
      this.position.y,
      12,
      initSize * 2.5,
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
      let circle = Matter.Bodies.polygon(x, y, 48, initSize, frictionOptions)

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
      this.anchorSprings.push(springAnchorA)
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
        if (this.currScale < (this.restScale - 0.1)) {
          this.grow(100)
          if (this.currScale / this.restScale > 0.5) {
            this.initialized = true
          }
        } else {

          this.anchorSprings.forEach((spring) => {
            spring.constraint.stiffness = 0.0025
            spring.constraint.damping = 0.1
          })
          this.springs.forEach((spring) => {
            spring.restLength = spring.constraint.length
          })

          this.state++
        }
        break
      case 1:
        // rest state
        if (this.isRotating) {
          this.rotate()
        }

        
        this.loosen()

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
        if (this.currScale < (this.destScale - 0.1)) {
          this.grow(400)
        } else {
          this.state = 1
        }
        break
      case 21:
        // shrink state
        if (this.currScale > (this.destScale + 0.1)) {
          this.shrink(400)
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

  grow(strength = 200) {
    // let amount = strength
    let diff = this.destScale - this.currScale
    let amount = 1 + (diff / strength)

    amount = amount < 1.000625 ? 1.000625 : amount
    this.scale(amount)
  }

  shrink(strength = 200) {
    // let amount = 1 / strength

    let diff = this.destScale - this.currScale
    let amount = 1 + (diff / strength)

    amount = amount > 0.999375 ? 0.999375 : amount
    this.scale(amount)
  }

  tighten() {
    this.isTight = true
    this.anchorSprings.forEach((spring) => {
      spring.constraint.stiffness = 0.0125
      spring.constraint.damping = 0.001
    })
  }

  loosen() {
    this.isTight = false
    this.anchorSprings.forEach((spring) => {
      spring.constraint.stiffness = 0.00125
      spring.constraint.damping = 0.1
    })
  }

  rotate() {
    if (this.targetRotation > this.currRotation) {
      let distance = Matter.Vector.sub(this.anchor.position, this.dishOrigin)
      let direction = Matter.Vector.normalise(distance)
      let perpendicular = Matter.Vector.rotate(direction, (Math.PI / 2) * (1 + -2 * this.dirRotation))
      let multiplier = (this.currRotation / this.targetRotation) * 4
      multiplier = multiplier > 1 ? 1 : multiplier
      let increment = Matter.Vector.mult(perpendicular, multiplier)
      
      let newPosition = Matter.Vector.add(this.anchor.position, increment)

      Matter.Body.setPosition(this.anchor, newPosition)
      
      this.currRotation++
    } else {
      this.isRotating = false
      this.targetRotation = 0
      this.currRotation = 0
    }
  }

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
        let direction = Matter.Vector.normalise(distance)
        let newPosition = Matter.Vector.mult(direction, (this.dishSize - 10))
        Matter.Body.setPosition(body, newPosition)
      }
    })
  }
}

export default Blob
