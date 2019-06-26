import Matter from 'matter-js'

class SVGRender {
  constructor(wrapper, blob, index) {
    this.wrapper = wrapper
    this.blob = blob

    let model = document.getElementById('blob-model')
    let element = model.cloneNode(true)
    element.setAttribute('id', 'blob-element-' + index)
    element.querySelector('clipPath').setAttribute('id', 'clip-path-' + index)
    let image  = element.querySelector('image')
    image.setAttribute('clip-path', 'url(#clip-path-' + index + ')')
    image.setAttribute('xlink:href', 'images/pattern' + index + '.png')
    this.element = element
    wrapper.appendChild(this.element)
  }

  init() {
    this.draw()
  }

  draw() {
    let center = this.blob.getCenter()
    let size = this.blob.size * this.blob.currScale

    let v1 = Matter.Vector.create(
      this.blob.bodies[0].position.x,
      this.blob.bodies[0].position.y
    )
    let offset = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(v1, center)), size)
    v1 = this.pixelPerfect(Matter.Vector.add(v1, offset))

    let v2 = Matter.Vector.create(
      this.blob.bodies[1].position.x,
      this.blob.bodies[1].position.y
    )
    offset = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(v2, center)), size)
    v2 = this.pixelPerfect(Matter.Vector.add(v2, offset))

    let between = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

    let points = 'M' + between.x + ' ' + between.y + ' '

    v1 = v2
    
    for (let i = 2; i < this.blob.bodies.length + 2; i++) {
      let index = i % this.blob.bodies.length

      v2 = Matter.Vector.create(
        this.blob.bodies[index].position.x,
        this.blob.bodies[index].position.y
      )
      offset = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(v2, center)), size)
      v2 = this.pixelPerfect(Matter.Vector.add(v2, offset))

      between = this.pixelPerfect(Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5))

      points += 'Q' + v1.x + ' ' + v1.y
      points += ' ' + between.x + ' ' + between.y + ' '

      v1 = v2
    }

    let path = this.element.getElementById('path')
    
    path.setAttribute('d', points)
  }

  pixelPerfect(vector) {
    let pixelVector = Matter.Vector.create(vector.x, vector.y)
    pixelVector.x = Math.floor(pixelVector.x * 10) * 0.1
    pixelVector.y = Math.floor(pixelVector.y * 10) * 0.1
    return pixelVector
  }
}

export default SVGRender
