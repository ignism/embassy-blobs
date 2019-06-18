import Matter from 'matter-js'

class SVGRender {
  constructor(wrapper, blob, index) {
    this.wrapper = wrapper
    this.blob = blob

    let model = document.getElementById('blob-model')
    let element = model.cloneNode(true)
    element.setAttribute('id', 'blob-element-' + index)
    this.element = element
    wrapper.appendChild(this.element)
  }

  init() {
    this.draw()
  }

  draw() {
    let v1 = Matter.Vector.create(
      this.blob.bodies[0].position.x,
      this.blob.bodies[0].position.y
    )
    let v2 = Matter.Vector.create(
      this.blob.bodies[1].position.x,
      this.blob.bodies[1].position.y
    )
    let center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

    let points = 'M' + center.x + ' ' + center.y + ' '

    v1 = v2

    for (let i = 2; i < this.blob.bodies.length; i++) {
      v2 = Matter.Vector.create(
        this.blob.bodies[i].position.x,
        this.blob.bodies[i].position.y
      )
      center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

      points += 'Q' + v1.x + ' ' + v1.y
      points += ' ' + center.x + ' ' + center.y + ' '

      v1 = v2
    }

    v2 = Matter.Vector.create(this.blob.bodies[0].position.x, this.blob.bodies[0].position.y)
    center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

    points += 'Q' + v1.x + ' ' + v1.y
    points += ' ' + center.x + ' ' + center.y + ' '

    v1 = v2

    v2 = Matter.Vector.create(this.blob.bodies[1].position.x, this.blob.bodies[1].position.y)
    center = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

    points += 'Q' + v1.x + ' ' + v1.y
    points += ' ' + center.x + ' ' + center.y + ' '

    let path = this.element.getElementById('path')
    path.setAttribute('d', points)
  }
}

export default SVGRender
