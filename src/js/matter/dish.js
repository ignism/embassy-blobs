import Matter from 'matter-js'

class Dish {
  constructor(position, num, radius) {
    this.position = position
    this.targetPosition = position
    this.num = num
    this.radius = radius
    this.targetRadius = radius
    this.bodies = []
  }

  init() {
    let segment = Math.PI * 2 / this.num

    let v1 = Matter.Vector.create(
      Math.cos(segment) * this.radius,
      Math.sin(segment) * this.radius
    )
    let v2 = Matter.Vector.create(
      Math.cos(segment * 2) * this.radius,
      Math.sin(segment * 2) * this.radius
    )
    let w = Matter.Vector.magnitude(Matter.Vector.sub(v1, v2))

    for (let i = 0; i < this.num; i++) {
      let angle = i * segment
      let offset = {
        x: Math.cos(angle) * this.radius,
        y: Math.sin(angle) * this.radius
      }
      let x = this.position.x + offset.x
      let y = this.position.y + offset.y
      let rectangle = Matter.Bodies.rectangle(x, y, w, 1, {
        angle: angle + Math.PI / 2,
        isStatic: true,
        friction: 0.0,
        frictionAir: 0.01,
        frictionStatic: 0.0
      })

      this.bodies.push(rectangle)
    }
  }

  update() {
    // let offset = Matter.Vector.sub(this.targetPosition, this.position)

    // if (Matter.Vector.magnitude(offset) > 10) {
    //   this.bodies.forEach(body => {
    //     offset = Matter.Vector.mult(offset, 0.1)
    //     let newPosition = Matter.Vector.add(body.position, offset)
    //     Matter.Body.setPosition(body, newPosition)
    //   })

    //   this.position = this.getCenter()
    // }

    let targetScale = this.targetRadius / this.radius
    if (Math.abs(targetScale - 1) > 0.001) {
      let offset = Matter.Vector.sub(this.targetPosition, this.position)
      offset = Matter.Vector.mult(offset, 0.1)
      this.position = Matter.Vector.add(this.position, offset)

      let scaleStep = (targetScale - 1) * 0.1
      let scale = 1 + scaleStep
      this.radius *= scale

      this.bodies.forEach((body) => {
        let bodyOffset = Matter.Vector.sub(this.position, body.position)
        bodyOffset = Matter.Vector.mult(bodyOffset, scale)

        Matter.Body.setPosition(
          body,
          Matter.Vector.add(this.position, bodyOffset)
        )
        Matter.Body.scale(body, scale, scale)
      })
    } else {
      this.targetRadius = this.radius
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

  moveTo(position) {
    // let offset = Matter.Vector.sub(position, this.getCenter())

    // this.bodies.forEach(body => {
    //   let newPosition = Matter.Vector.add(body.position, offset)
    //   Matter.Body.setPosition(body, newPosition)
    // })

    // this.position = this.getCenter()
    this.targetPosition = position
  }

  resizeTo(radius) {
    // this.bodies.forEach(body => {
    //   let offset = Matter.Vector.sub(this.position, body.position)
    //   offset = Matter.Vector.mult(offset, scale)

    //   Matter.Body.setPosition(body, Matter.Vector.add(this.position, offset))
    // })
    this.targetRadius = radius
  }

  addToWorld(world) {
    this.bodies.forEach((body) => {
      Matter.World.add(world, body)
    })
  }
}

export default Dish
