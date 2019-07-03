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
    this.blobsInitialized = false
    this.initialized = false
    this.noise = new tumult.Simplex1('seed')
    this.ticker = 0
    this.isScaling = false
    this.currentBlob = -1
    this.preloadedImages = 0
    this.isRunning = true
    this.throttledResize = throttle(this.resize, 200)

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

    let loaderWrapper = document.createElement('div')
    loaderWrapper.setAttribute('id', 'loader-svg-wrapper')
    let loaderString = `<svg id="image-model" class="blob-image-loader">
    <image 
    xlink:href=""
    class="blob-image blob-pattern" width="100%" height="100%"></image>
    </svg>`

    let blobWrapper = document.createElement('div')
    blobWrapper.setAttribute('id', 'blob-svg-wrapper')
    let blobString = `<svg id="blob-model" class="blob-element">
    <clipPath id="clip-path">
      <path id="path" d=""></path>
    </clipPath>
    <image clip-path="url(#clip-path)" 
    xlink:href=""
    class="blob-image blob-pattern" preserveAspectRatio="xMinYMin slice"></image>
    <image clip-path="url(#clip-path)" 
    xlink:href=""
    class="blob-image blob-embassy" preserveAspectRatio="xMinYMin slice"></image>
    </svg>`

    loaderWrapper.innerHTML = loaderString.trim()
    blobWrapper.innerHTML = blobString.trim()

    this.wrapper.appendChild(loaderWrapper)
    this.wrapper.appendChild(blobWrapper)

    this.embassies.forEach((embassy) => {
      if (embassy.image) {
        let wrapper = document.querySelector('#loader-svg-wrapper')
        let svg = wrapper.querySelector('#image-model').cloneNode(true)
        svg.setAttribute('id', embassy.slug + '-loader')
        let image = svg.querySelector('.blob-image')
        image.setAttribute('xlink:href', embassy.image)
        image.addEventListener('load', (event) => {
          this.preloadedImages++
        })
        wrapper.appendChild(svg)
      }
    })

    this.createDish()
    this.createBlobs()
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

  addEventListeners() {
    window.addEventListener('resize', this.throttledResize, false)
  }

  resize() {
    if (this.debug) {
      this.canvasRender.resize()
    }

    let wrapperCenter = Matter.Vector.create(
      this.wrapper.clientWidth * 0.5,
      this.wrapper.clientHeight * 0.5
    )

    this.wrapperCenter = wrapperCenter
  }

  reset() {
    this.blobs.forEach((blob) => {
      blob.reset()
    })

    this.svgRenders.forEach((svgRender) => {
      svgRender.reset()
    })
  }

  highlight(slug) {
    if (this.initialized) {
      if (slug) {
        this.embassies.forEach((embassy) => {
          if (embassy.slug == slug) {
            let index = Math.floor(Math.random() * 4)
            while (index == this.currentBlob) {
              index = Math.floor(Math.random() * 4)
            }
            
            this.scaleBlob(index, 6)
            this.setBlobBackground(index, embassy.image)
            this.currentBlob = index
          }
        })

        return true
      }
    }
    return false
  }

  activate() {
    if (this.currentBlob > -1) {
      this.stop()
      this.svgRenders[this.currentBlob].blowUp()
      this.destroy()
      return true
    }
    return false
  }

  run() {
    this.isRunning = true
  }

  stop() {
    this.isRunning = false
  }

  destroy() {
    window.removeEventListener('resize', this.throttledResize, false)
    this.stop()
  }

  animate() {
    if (this.isRunning) {
      this.update()
      this.draw()
      window.requestAnimationFrame(this.animate.bind(this))
    }
  }

  update() {
    let offset = Matter.Vector.sub(this.wrapperCenter, this.dish.position)
    if (Matter.Vector.magnitude(offset) > 4) {
      let norm = Matter.Vector.mult(Matter.Vector.normalise(offset), 4)
      let newPosition = Matter.Vector.add(this.dish.position, norm)
      this.dish.moveTo(newPosition)
    }

    if (!this.initialized) {
      if (this.blobsInitialized && this.preloadedImages === this.embassies.length) {
        this.initialized = true
      }
    }

    if (this.blobsInitialized) {
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
      this.blobsInitialized = initialized
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

  setBlobBackground(index, image) {
    this.svgRenders[index].setBackgroundImage(image)
  }
}

export default MatterApp
