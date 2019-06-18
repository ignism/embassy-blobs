import Matter from 'matter-js'
import _ from 'lodash'
import { engine } from './engine'
import CanvasRender from './canvas-render'
import Blob from './blob'
import Dish from './dish'
import SVGRender from './svg-render'

class MatterApp {
  constructor(wrapper, numBlobs) {
    this.wrapper = wrapper
    this.engine = engine
    this.canvasRender = new CanvasRender(wrapper, engine)
    this.mouse = Matter.Mouse.create(this.canvasRender.render.canvas)
    this.dish = new Dish(wrapper.clientWidth * 0.5, wrapper.clientHeight * 0.5, 24, 240)
    this.numBlobs = numBlobs
    this.blobs = []
    this.overblob = -1
    this.svgRenders = []
  }

  init() {
    this.canvasRender.init()

    this.createDish()
    this.createBlobs()

    this.addEventListeners()
  
    let mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.009,
        render: {
          visible: true
        }
      }
    })
    Matter.World.add(this.engine.world, mouseConstraint)
    this.canvasRender.render.mouse = this.mouse

    Matter.Engine.run(this.engine)
    Matter.Render.run(this.canvasRender.render)
  }

  createDish() {
    this.dish.init()
    this.dish.addToWorld(engine.world)
  }

  createBlobs() {
    let center = {
      x: this.canvasRender.render.canvas.width * 0.5,
      y: this.canvasRender.render.canvas.height * 0.5
    }

    let blobSegments = 12
    let sinAngle = Math.sin(Math.PI * 2 / blobSegments)

    let svgWrapper = document.getElementById('svg-wrapper')

    for (let i = 0; i < this.numBlobs; i++) {
      let angle = i / this.numBlobs * Math.PI * 2
      let position = Matter.Vector.create(center.x + Math.cos(angle) * 100, center.y + Math.sin(angle) * 100)

      let randomRadius = Math.random() * 40 + 24
      let size = sinAngle * randomRadius * 0.5
      let blob = new Blob(position, blobSegments, size, randomRadius)
      blob.init()
      blob.addToWorld(engine.world)

      let svgRender = new SVGRender(svgWrapper, blob, i)
      svgRender.init()

      this.blobs.push(blob)
      this.svgRenders.push(svgRender)
    }
  }

  addEventListeners() {
    window.addEventListener('resize', _.throttle(event => {
      this.canvasRender.resize()
      
      let wrapperCenter = Matter.Vector.create(this.wrapper.clientWidth * 0.5, this.wrapper.clientHeight * 0.5)
      this.dish.moveTo(wrapperCenter)
    }, 200))
       
    window.addEventListener('mousemove', _.throttle((event) => {
      let distance = 99999
      let index = 0
      let blobIndex = -1

      this.blobs.forEach(blob => {
        let distBlob = Matter.Vector.magnitude(
          Matter.Vector.sub(this.mouse.position, blob.getCenter())
        )
      
        if (distBlob < distance) {
          distance = distBlob
          if (distance < blob.radius) {
            blobIndex = index
          }
        }

        index++
      })
    
      this.overblob = blobIndex
    }, 200))
  }

  update() {
    this.blobs.forEach(blob => {
      
    })
  }

  draw() {
    this.svgRenders.forEach(svgRender => {
      svgRender.draw()
    })
  }
}

export default MatterApp