import Matter from 'matter-js'

class CanvasRender {
  constructor(element, engine) {
    this.element = element
    this.engine = engine
    this.render = Matter.Render.create({ element: element, engine: engine })
  }

  init() {
    this.resize()
    this.addEventListeners()
  }

  resize() {
    this.render.canvas.width = this.element.clientWidth
    this.render.canvas.height = this.element.clientHeight
  }

  addEventListeners() {
  }
}

export default CanvasRender
