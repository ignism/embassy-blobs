import Matter from 'matter-js/build/matter.min.js'

class Dish {
  constructor(position, num, radius) {
    this.position = position
    this.num = num
    this.radius = radius
    this.bodies = []
  }

  init() {
    let segment = Math.PI * 2 / this.num;

    let v1 = Matter.Vector.create(Math.cos(segment) * this.radius, Math.sin(segment) * this.radius)
    let v2 = Matter.Vector.create(Math.cos(segment*2) * this.radius, Math.sin(segment*2) * this.radius)
    let w = Matter.Vector.magnitude(Matter.Vector.sub(v1, v2))

    for (let i = 0; i < this.num; i++) {
      let angle = i * segment
      let offset = {
        x: Math.cos(angle) * this.radius,
        y: Math.sin(angle) * this.radius
      }
      let x = this.position.x + offset.x
      let y = this.position.y + offset.y
      let rectangle = Matter.Bodies.rectangle(x, y, w, 1, { angle: angle + Math.PI / 2, isStatic: true })

      this.bodies.push(rectangle)
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

  moveTo(position) {
    let offset = Matter.Vector.sub(position, this.getCenter())

    this.bodies.forEach(body => {
      let newPosition = Matter.Vector.add(body.position, offset)
      Matter.Body.setPosition(body, newPosition)
    })

    this.position = this.getCenter()
  }

  addToWorld(world) {
    this.bodies.forEach((body) => {
      Matter.World.add(world, body)
    })
  }
}

export default Dish 
