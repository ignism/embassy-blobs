import Matter from 'matter-js'
import { throttle } from 'lodash-es'
import { engine } from './engine'
import CanvasRender from './canvas-render'
import Blob from './blob'
import Dish from './dish'
import SVGRender from './svg-render'

class MatterApp {
  constructor(wrapper, numBlobs, debug = false) {
    this.wrapper = wrapper
    this.mouse = Matter.Vector.create()
    this.dishDestination = Matter.Vector.create(
      wrapper.clientWidth * 0.5,
      wrapper.clientHeight * 0.5
    )
    this.dish = new Dish(this.dishDestination, 24, 240)
    this.dishOuter = new Dish(this.dishDestination, 24, 260)
    this.numBlobs = numBlobs
    this.blobs = []
    this.overblob = -1
    this.svgRenders = []
    this.debug = debug

    if (debug) {
      this.canvasRender = new CanvasRender(document.getElementById('blob-debug'), engine)
    }
  }

  init() {
    if (this.debug) {
      this.canvasRender.init()
      Matter.Render.run(this.canvasRender.render)
    } 

    this.createDish()
    this.createBlobs()

    this.addEventListeners()
  }

  createDish() {
    this.dish.init()
    this.dish.addToWorld(engine.world)
    this.dishOuter.init()
    this.dishOuter.addToWorld(engine.world)
  }

  createBlobs() {
    let center = {
      x: this.wrapper.clientWidth * 0.5,
      y: this.wrapper.clientHeight * 0.5
    }

    let blobSegments = 12
    let sinAngle = Math.sin(Math.PI * 2 / blobSegments)

    let svgWrapper = this.wrapper.querySelector('#svg-wrapper')

    let placementRadius = this.dish.radius / 2

    let blobRadi = [80, 72, 48, 24]

    for (let i = 0; i < this.numBlobs; i++) {
      let angle = i / this.numBlobs * Math.PI * 2
      let position = Matter.Vector.create(
        center.x + Math.cos(angle) * placementRadius,
        center.y + Math.sin(angle) * placementRadius
      )

      // let randomRadius = Math.random() * 20 + 60
      let blobRadius = blobRadi[i % blobRadi.length] * 1.25
      let size = sinAngle * blobRadius * 0.5
      let blob = new Blob(position, blobSegments, 6, blobRadius)
      blob.init()
      blob.addToWorld(engine.world)

      let svgRender = new SVGRender(svgWrapper, blob, i)
      svgRender.init()

      this.blobs.push(blob)
      this.svgRenders.push(svgRender)
    }
  }

  addEventListeners() {
    window.addEventListener(
      'resize',
      throttle((event) => {
        this.canvasRender.resize()

        let wrapperCenter = Matter.Vector.create(
          this.wrapper.clientWidth * 0.5,
          this.wrapper.clientHeight * 0.5
        )

        this.dishDestination = wrapperCenter
      }, 200)
    )

    window.addEventListener(
      'mousemove',
      throttle((event) => {
        let distance = 99999
        let index = 0
        let blobIndex = -1

        this.mouse.x = Math.max(0, event.clientX - window.innerWidth * 0.5)
        this.mouse.y = event.clientY

        this.blobs.forEach((blob) => {
          let distBlob = Matter.Vector.magnitude(
            Matter.Vector.sub(this.mouse, blob.getCenter())
          )

          if (distBlob < distance) {
            distance = distBlob
            blobIndex = index
          }

          index++
        })

        if (this.blobs[blobIndex].isInside(this.mouse)) {
          if (this.overblob == -1) {
            if (this.blobs[blobIndex].state != 0) {
              this.blobs[blobIndex].scaleTo(6)
              this.blobs[blobIndex].isMouseOver = true
            }
          } else if (this.overblob != blobIndex) {
            this.blobs[blobIndex].scaleTo(6)
            this.blobs[blobIndex].isMouseOver = true

            this.blobs[this.overblob].reset() 
          }
          this.overblob = blobIndex
        } else {
          if (this.overblob > -1) {
            if (this.blobs[blobIndex].state != 0)
              this.blobs[this.overblob].reset()
          }
          this.overblob = -1
        }
      }, 20)
    )
  }

  update() {
    let offset = Matter.Vector.sub(this.dishDestination, this.dish.position)
    if (Matter.Vector.magnitude(offset) > 4) {
      let norm = Matter.Vector.mult(Matter.Vector.normalise(offset), 4)
      let newPosition = Matter.Vector.add(this.dish.position, norm)
      this.dish.moveTo(newPosition)
    }

    this.blobs.forEach((blob) => {
      blob.update()
    })

    Matter.Engine.update(engine)
  }

  draw() {
    this.svgRenders.forEach((svgRender) => {
      svgRender.draw()
    })
  }
}

export default MatterApp
