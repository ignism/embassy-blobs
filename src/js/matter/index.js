import Matter from 'matter-js'
import { throttle } from 'lodash-es'
import { engine } from './engine'
import CanvasRender from './canvas-render'
import Blob from './blob'
import Dish from './dish'
import SVGRender from './svg-render'
import tumult from 'tumult'

class MatterApp {
  constructor(wrapper, embassies, numBlobs, debug = false) {
    this.embassies = embassies
    this.wrapper = wrapper
    this.mouse = Matter.Vector.create()
    this.wrapperCenter = Matter.Vector.create(
      wrapper.clientWidth * 0.5,
      wrapper.clientHeight * 0.5
    )
    this.dish = new Dish(this.wrapperCenter, 24, 280)
    this.dishOuter = new Dish(this.wrapperCenter, 24, 284)
    this.numBlobs = numBlobs
    this.blobs = []
    this.overblob = -1
    this.svgRenders = []
    this.debug = debug
    this.initialized = false
    this.noise = new tumult.Simplex1('seed')
    this.ticker = 0
    this.isScaling = false
    this.triggers
    this.currentScaledBlob = -1

    if (debug) {
      this.canvasRender = new CanvasRender(
        document.getElementById('blob-debug'),
        engine
      )
    }
  }

  init() {
    if (this.debug) {
      this.canvasRender.init()
      Matter.Render.run(this.canvasRender.render)
    }

    let svgWrapper = document.createElement('div')
    svgWrapper.setAttribute('id', 'blob-svg-wrapper')
    this.wrapper.appendChild(svgWrapper)

    this.createDish()
    this.createBlobs()
    this.createTriggers()
    this.addEventListeners()

    this.animate()
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

    let svgWrapper = this.wrapper.querySelector('#blob-svg-wrapper')

    let placementRadius = this.dish.radius / 2

    let blobRadi = [96, 72, 64, 32]

    for (let i = 0; i < this.numBlobs; i++) {
      let angle = i / this.numBlobs * Math.PI * 2
      let position = Matter.Vector.create(
        center.x + Math.cos(angle) * placementRadius,
        center.y + Math.sin(angle) * placementRadius
      )

      // let randomRadius = Math.random() * 20 + 60
      let blobRadius = blobRadi[i % blobRadi.length] * 1.25
      // let size = sinAngle * blobRadius * 0.5
      let blob = new Blob(position, blobSegments, blobRadius)
      blob.init()
      blob.addToWorld(engine.world)

      let svgRender = new SVGRender(svgWrapper, blob, i)
      svgRender.init()

      this.blobs.push(blob)
      this.svgRenders.push(svgRender)
    }
  }

  createTriggers() {
    let triggerInterface = document.getElementById('blob-interface')

    if (triggerInterface) {
      this.triggers = Array.from(triggerInterface.querySelectorAll('.blob-trigger'))
    }
  }

  addEventListeners() {
    window.addEventListener(
      'resize',
      throttle((event) => {
        if (this.debug) {
          this.canvasRender.resize()
        }

        let wrapperCenter = Matter.Vector.create(
          this.wrapper.clientWidth * 0.5,
          this.wrapper.clientHeight * 0.5
        )

        this.wrapperCenter = wrapperCenter
      }, 200)
    )

    // window.addEventListener(
    //   'mousemove',
    //   throttle((event) => {
    //     let distance = 99999
    //     let index = 0
    //     let blobIndex = -1
    //     this.mouse.x = Math.max(0, event.clientX - window.innerWidth * 0.5)
    //     this.mouse.y = event.clientY
    //     this.blobs.forEach((blob) => {
    //       let distBlob = Matter.Vector.magnitude(
    //         Matter.Vector.sub(this.mouse, blob.getCenter())
    //       )
    //       if (distBlob < distance) {
    //         distance = distBlob
    //         blobIndex = index
    //       }
    //       index++
    //     })
    //     if (this.blobs[blobIndex].isInside(this.mouse)) {
    //       if (this.overblob == -1) {
    //         if (this.blobs[blobIndex].state != 0) {
    //           // this.blobs[blobIndex].scaleTo(6)
    //           this.scaleBlob(blobIndex, 6)
    //           this.isScaling = true
    //           this.blobs[blobIndex].isMouseOver = true
    //         }
    //       } else if (this.overblob != blobIndex) {
    //         // this.blobs[blobIndex].scaleTo(6)
    //         this.scaleBlob(blobIndex, 6)
    //         this.isScaling = true
    //         this.blobs[blobIndex].isMouseOver = true
    //         // this.blobs[this.overblob].reset()
    //       }
    //       this.overblob = blobIndex
    //     } else {
    //       if (this.overblob > -1) {
    //         // if (this.blobs[blobIndex].state != 0)
    //         //   this.blobs[this.overblob].reset()
    //         this.blobs.forEach((blob) => {
    //           blob.reset()
    //           this.isScaling = false
    //         })
    //       }
    //       this.overblob = -1
    //     }
    //   }, 20)
    // )

    this.triggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', event => {
        let index = Math.floor(Math.random() * 4)
        while (index == this.currentScaledBlob) {
          index = Math.floor(Math.random() * 4)
        }
        this.scaleBlob(index, 6)
        this.currentScaledBlob = index
      })
    })
  }

  animate() {
    this.update()
    this.draw()
    window.requestAnimationFrame(this.animate.bind(this))
  }

  update() {
    let offset = Matter.Vector.sub(this.wrapperCenter, this.dish.position)
    if (Matter.Vector.magnitude(offset) > 4) {
      let norm = Matter.Vector.mult(Matter.Vector.normalise(offset), 4)
      let newPosition = Matter.Vector.add(this.dish.position, norm)
      this.dish.moveTo(newPosition)
    }

    if (this.initialized) {
      let strength = 0.0002

      this.blobs.forEach((blob) => {
        if (this.isScaling == false) {
          blob.addMovement(this.wrapperCenter, strength)
        }
        blob.update()
      })
    } else {
      let initialized = true
      this.blobs.forEach((blob) => {
        if (blob.state != 1) {
          initialized = false
        }
        blob.update()
      })
      this.initialized = initialized
    }

    Matter.Engine.update(engine)
  }

  draw() {
    this.svgRenders.forEach((svgRender) => {
      svgRender.draw()
    })
  }

  scaleBlob(index, amount) {
    // get relative scale
    let relativeScale = amount / this.blobs[index].restScale

    this.blobs.forEach((blob, key) => {
      if (key === index) {
        // scale blob to amount
        blob.scaleTo(amount)
      } else {
        // scale rest of blobs to 1/relative scale
        let negativeAmount = 1 / relativeScale
        let normalized = 1 - (1 - negativeAmount) / 2
        let scale = blob.restScale * normalized
        blob.scaleTo(scale)
      }
    })
  }

}

export default MatterApp
