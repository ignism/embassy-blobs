import Matter from 'matter-js'
import _ from 'lodash'
import { engine } from './engine'
import CanvasRender from './canvas-render'
import Blob from './blob'
import Dish from './dish';

class MatterApp {
  constructor(wrapper) {
    this.wrapper = wrapper
    this.engine = engine
    this.canvasRender = new CanvasRender(wrapper, engine)
    this.dish = new Dish(wrapper.clientWidth * 0.5, wrapper.clientHeight * 0.5, 24, 240)
    this.blobs = []
  }

  init() {
    this.dish.init()
    this.dish.addToWorld(engine.world)

    let blob = new Blob(this.wrapper.clientWidth / 2 - 100, this.wrapper.clientHeight / 2 - 100, 12, 12, 48)
    blob.init()
    blob.addToWorld(engine.world)
    this.blobs.push(blob)

    this.canvasRender.init()

    this.addEventListeners()

    Matter.Engine.run(this.engine)
    Matter.Render.run(this.canvasRender.render)
  }

  addEventListeners() {
    window.addEventListener('resize', _.throttle(event => {
      this.canvasRender.resize()
      
      let wrapperCenter = Matter.Vector.create(this.wrapper.clientWidth * 0.5, this.wrapper.clientHeight * 0.5)
      this.dish.moveTo(wrapperCenter)
    }, 200))
       
    window.addEventListener('keypress', (event) => {
      event.preventDefault()
    
      if (event.key == 'z') {
        //blob.grow()
      }
      if (event.key == 'x') {
        //blob.shrink()
      }
    })
  }
}

export default MatterApp