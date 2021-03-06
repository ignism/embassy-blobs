import Matter from 'matter-js'

class SVGRender {
  constructor(wrapper, blob, pattern, index) {
    this.wrapper = wrapper
    this.blob = blob
    this.blowUpPositions = []
    this.blowUpTicker = 0
    this.blowUpCenter = blob.getCenter()

    let model = document.getElementById('blob-model')

    let element = model.cloneNode(true)
    element.setAttribute('id', 'blob-element-' + index)
    element.querySelector('clipPath').setAttribute('id', 'clip-path-' + index)

    let patternImage = element.querySelector('image.blob-pattern')
    patternImage.setAttribute('clip-path', 'url(#clip-path-' + index + ')')
    patternImage.setAttribute('xlink:href', pattern)
    patternImage.setAttribute('width', '100%')
    patternImage.setAttribute('height', '100%')

    let embassyImage = element.querySelector('image.blob-embassy')
    embassyImage.setAttribute('clip-path', 'url(#clip-path-' + index + ')')
    embassyImage.setAttribute('xlink:href', '')
    embassyImage.setAttribute('width', '100%')
    embassyImage.setAttribute('height', '100%')

    this.element = element
    wrapper.appendChild(this.element)
  }

  init() {
    this.draw()
  }

  blowUp() {
    this.blowUpTicker++

    let points = []

    if (this.blowUpPositions.length < 1) {
      this.blob.bodies.forEach((body) => {
        points.push(body.position)
      })
    } else {
      points = this.blowUpPositions
    }

    let isOutside = true
    let mutliplier = 1 + (this.blowUpTicker * this.blowUpTicker / 20000)

    for (let p = 0; p < points.length; p++) {
      let v = Matter.Vector.sub(points[p], this.blowUpCenter)
      v = Matter.Vector.mult(v, mutliplier)
      points[p] = Matter.Vector.add(this.blowUpCenter, v)

      if (this.isInsideWrapper(points[p])) {
        isOutside = false
      }
    }

    this.draw(points)

    this.blowUpPositions = points

    if (isOutside) {
    } else {
      window.requestAnimationFrame(this.blowUp.bind(this))
    }
  }

  isInsideWrapper(vector) {
    let w = this.wrapper.clientWidth
    let h = this.wrapper.clientHeight
    let margin = 100

    if (
      vector.x > 0 - margin &&
      vector.x < w + margin &&
      vector.y > 0 - margin &&
      vector.y < h + margin
    ) {
      return true
    }

    return false
  }

  draw(vectors) {
    let points = []

    if (!vectors) {
      this.blob.bodies.forEach((body) => {
        points.push(body.position)
      })
    } else {
      points = vectors
    }

    let center = this.blob.getCenter()
    let size = this.blob.size * this.blob.currScale

    let v1 = Matter.Vector.create(points[0].x, points[0].y)
    let offset = Matter.Vector.mult(
      Matter.Vector.normalise(Matter.Vector.sub(v1, center)),
      size
    )
    v1 = this.pixelPerfect(Matter.Vector.add(v1, offset))

    let v2 = Matter.Vector.create(points[1].x, points[1].y)
    offset = Matter.Vector.mult(
      Matter.Vector.normalise(Matter.Vector.sub(v2, center)),
      size
    )
    v2 = this.pixelPerfect(Matter.Vector.add(v2, offset))

    let between = Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)

    let bezier = 'M' + between.x + ' ' + between.y + ' '

    v1 = v2

    for (let i = 2; i < points.length + 2; i++) {
      let index = i % points.length

      v2 = Matter.Vector.create(points[index].x, points[index].y)
      offset = Matter.Vector.mult(
        Matter.Vector.normalise(Matter.Vector.sub(v2, center)),
        size
      )
      v2 = this.pixelPerfect(Matter.Vector.add(v2, offset))

      between = this.pixelPerfect(
        Matter.Vector.mult(Matter.Vector.add(v1, v2), 0.5)
      )

      bezier += 'Q' + v1.x + ' ' + v1.y
      bezier += ' ' + between.x + ' ' + between.y + ' '

      v1 = v2
    }

    let path = this.element.getElementById('path')

    path.setAttribute('d', bezier)
  }

  reset() {
    this.element.classList.remove('active')
  }

  setBackgroundImage(image) {
    let embassyImage = this.element.querySelector('image.blob-embassy')
    // embassyImage.setAttribute('xlink:href', image)
    embassyImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', image)
    // getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    this.element.classList.add('active')
  }

  pixelPerfect(vector) {
    let pixelVector = Matter.Vector.create(vector.x, vector.y)
    pixelVector.x = Math.floor(pixelVector.x * 10) * 0.1
    pixelVector.y = Math.floor(pixelVector.y * 10) * 0.1
    return pixelVector
  }
}

export default SVGRender
