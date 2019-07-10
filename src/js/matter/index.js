import Matter from 'matter-js'
import { throttle } from 'lodash-es'
import { engine } from './engine'
import CanvasRender from './canvas-render'
import Blob from './blob'
import Dish from './dish'
import SVGRender from './svg-render'
import tumult from 'tumult'

class MatterApp {
  constructor(wrapper, embassies, patterns, numBlobs, debug = false) {
    this.embassies = embassies
    this.patterns = patterns
    this.wrapper = wrapper
    this.mouse = Matter.Vector.create()
    this.dishOrigin = this.calcDishOrigin()
    this.dishSize = this.calcDishSize()
    this.dish = new Dish(this.dishOrigin, 24, this.dishSize)
    this.dishOuter = new Dish(this.dishOrigin, 24, this.dishSize + 4)
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
    this.throttledResize = throttle(this.resize.bind(this), 200)

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

    loaderWrapper.style.opacity = 0
    blobWrapper.style.opacity = 0
    blobWrapper.style.transition = '500ms ease-out'

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

  calcDishSize() {
    let w = this.wrapper.clientWidth
    let h = this.wrapper.clientHeight
    return Math.sqrt(w * w + h * h) * 0.4
  }

  calcDishOrigin() {
    let w = this.wrapper.clientWidth
    let s = this.calcDishSize()
    let x = w * 0.05 + s
    let y = this.wrapper.clientHeight * 0.45
    return Matter.Vector.create(x, y)
  }

  randomPositionInDish() {
    let r = Math.random() * this.calcDishSize()
    let angle = Math.random() * Math.PI * 2.0
    let vector = Matter.Vector.create(Math.cos(angle) * r, Math.sin(angle) * r)

    let origin = this.calcDishOrigin()

    return Matter.Vector.add(origin, vector)
  }

  createDish() {
    this.dish.init()
    this.dish.addToWorld(engine.world)
    this.dishOuter.init()
    this.dishOuter.addToWorld(engine.world)
  }

  createBlobs() {
    let blobSegments = 12

    let svgWrapper = this.wrapper.querySelector('#blob-svg-wrapper')

    let placementRadius = this.dish.radius / 2

    let rNorm = this.dishSize * 0.4
    let blobRadi = [rNorm * 1, rNorm * 0.8, rNorm * 0.7, rNorm * 0.5]

    for (let i = 0; i < this.numBlobs; i++) {
      let angle = i / this.numBlobs * Math.PI * 2
      let position = Matter.Vector.create(
        this.dishOrigin.x + Math.cos(angle) * placementRadius,
        this.dishOrigin.y + Math.sin(angle) * placementRadius
      )

      let blobRadius = blobRadi[i % blobRadi.length] * 1.25
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
    window.addEventListener('resize', this.throttledResize, true)
  }

  resize() {
    if (this.debug) {
      this.canvasRender.resize()
    }

    if (this.initialized) {
      let dishOrigin = this.calcDishOrigin()

      this.dish.moveTo(dishOrigin)
      this.dishOuter.moveTo(dishOrigin)

      this.dishSize = this.calcDishSize()
      let dishScale = this.dishSize / this.dish.radius
      let blobScale = 1 + (dishScale - 1) * 0.66667

      this.blobs.forEach((blob) => {
        blob.resize(blobScale)
      })

      this.dish.resizeTo(this.dishSize)
      this.dishOuter.resizeTo(this.dishSize + 4)
    }
  }

  reset() {
    this.blobs.forEach((blob) => {
      blob.reset()
    })

    this.svgRenders.forEach((svgRender) => {
      svgRender.reset()
    })
  }

  hover() {
    let index = Math.floor(Math.random() * 4)
    while (index == this.currentBlob) {
      index = Math.floor(Math.random() * 4)
    }

    this.blobs[index].addMovement(this.calcDishOrigin(), 1)
    this.currentBlob = index
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

            let scale = this.dishSize / 24 * 0.65

            this.scaleBlob(index, scale)
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
    if (!this.initialized) {
      if (
        this.blobsInitialized &&
        this.preloadedImages === this.embassies.length
      ) {
        this.initialized = true
        this.wrapper.querySelector('#blob-svg-wrapper').style.opacity = 1
        let initEvent = new CustomEvent('initialized')
        this.wrapper.dispatchEvent(initEvent)
      }
    }

    if (this.blobsInitialized) {
      this.blobs.forEach((blob) => {
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

    this.dish.update()
    this.dishOuter.update()

    Matter.Engine.update(engine)
  }

  draw() {
    this.svgRenders.forEach((svgRender) => {
      svgRender.draw()
    })
  }

  scaleBlob(index, amount) {
    let relativeScale = amount / this.blobs[index].restScale

    this.blobs.forEach((blob, key) => {
      if (key === index) {
        blob.scaleTo(amount)
      } else {
        let negativeAmount = 1 / relativeScale
        let normalized = 1 - (1 - negativeAmount) / 1
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
