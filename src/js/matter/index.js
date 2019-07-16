import Matter from 'matter-js'
import { throttle } from 'lodash-es'
import { engine } from './engine'
import CanvasRender from './canvas-render'
import Blob from './blob'
import Dish from './dish'
import SVGRender from './svg-render'
import 'classlist-polyfill'

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
    this.rNorm = this.dishSize * 0.6
    this.blobRadi = [this.rNorm * 1, this.rNorm * 0.8, this.rNorm * 0.7, this.rNorm * 0.5]
    this.blobScales = [this.rNorm * 1 / 24, this.rNorm * 0.8 / 24, this.rNorm * 0.7 / 24, this.rNorm * 0.5 / 24]
    this.highlightScales = [this.rNorm * 1.25 / 24, this.rNorm * 0.7 / 24, this.rNorm * 0.6 / 24, this.rNorm * 0.45 / 24]
    this.blobs = []
    this.overblob = -1
    this.svgRenders = []
    this.debug = debug
    this.blobsInitialized = false
    this.initialized = false
    // this.ticker = 0
    this.isScaling = false
    this.currentBlob = -1
    this.preloadedImages = 0
    this.isRunning = true
    this.throttledResize = throttle(this.resize.bind(this), 200)
    this.throttledMousemove = throttle(this.mousemove.bind(this), 200)
    this.rotationTrigger = 400
    this.rotationTicker = 0
    this.throttleFPS = {
      fps: 0,
      fpsInterval: 0,
      startTime: 0,
      now: 0,
      then: 0,
      elapsed: 0
    }

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

    let loaderString = `<div id="image-model" class="blob-image-loader">
    <img src="" class="blob-image" width="100%" height="100%"/>
    </div>`

    let blobWrapper = document.createElement('div')
    blobWrapper.setAttribute('id', 'blob-svg-wrapper')
    let blobString = `<svg id="blob-model" class="blob-element" preserveAspectRatio="xMidYMid slice">
    <clipPath id="clip-path">
      <path id="path" d=""></path>
    </clipPath>
    <image preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-path)" 
    xlink:href=""
    class="blob-image blob-pattern"></image>
    <image preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-path)" 
    xlink:href=""
    class="blob-image blob-embassy"></image>
    </svg>`

    loaderWrapper.innerHTML = loaderString.trim()
    blobWrapper.innerHTML = blobString.trim()

    loaderWrapper.style.opacity = 0
    // blobWrapper.style.opacity = 0
    blobWrapper.style.transition = '500ms ease-out'

    this.wrapper.appendChild(loaderWrapper)
    this.wrapper.appendChild(blobWrapper)

    this.embassies.forEach((embassy) => {
      if (embassy.image) {
        let wrapper = document.querySelector('#loader-svg-wrapper')
        let model = wrapper.querySelector('#image-model').cloneNode(true)
        model.setAttribute('id', embassy.slug + '-loader')
        let image = model.querySelector('.blob-image')
        image.addEventListener('load', (event) => {
          this.preloadedImages++
        })
        image.setAttribute('src', embassy.image)
        wrapper.appendChild(model)
      }
    })

    this.createDish()
    this.createBlobs()
    this.addEventListeners()

    this.throttleFPS.fps = 60
    this.throttleFPS.fpsInterval = 1000 / this.throttleFPS.fps
    this.throttleFPS.then = Date.now()
    this.throttleFPS.startTime = this.throttleFPS.then
    this.animate()
  }

  calcDishSize() {
    let w = this.wrapper.clientWidth
    let h = this.wrapper.clientHeight
    return Math.sqrt(w * w + h * h) * 0.4
  }

  calcDishOrigin() {
    let s = this.calcDishSize()
    let margin = this.wrapper.clientWidth * 0.05
    let x = margin + s
    let y = this.wrapper.clientHeight - margin - s
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
    let blobSegments = 24

    let svgWrapper = this.wrapper.querySelector('#blob-svg-wrapper')

    let placementRadius = this.dish.radius / 2

    for (let i = 0; i < this.numBlobs; i++) {
      let angle = i / this.numBlobs * Math.PI * 2
      let position = Matter.Vector.create(
        this.dishOrigin.x + Math.cos(angle) * placementRadius,
        this.dishOrigin.y + Math.sin(angle) * placementRadius
      )

      let blobScale = this.blobScales[i % this.blobScales.length]
      let blob = new Blob(position, blobSegments, blobScale, this.dishSize, this.dishOrigin)
      blob.init()
      blob.addToWorld(engine.world)

      let pattern = this.patterns[i].image
      let svgRender = new SVGRender(svgWrapper, blob, pattern, i)
      svgRender.init()

      this.blobs.push(blob)
      this.svgRenders.push(svgRender)
    }
  }

  addEventListeners() {
    window.addEventListener('resize', this.throttledResize, true)
    this.wrapper.addEventListener('mousemove', this.throttledMousemove, true)
  }

  resize() {
    if (this.debug) {
      this.canvasRender.resize()
    }

    if (this.initialized) {
      let dishOrigin = this.calcDishOrigin()
      let dishSize = this.calcDishSize()

      this.dish.moveTo(dishOrigin)
      this.dishOuter.moveTo(dishOrigin)

      this.dishSize = dishSize
      this.rNorm = this.dishSize * 0.6
      this.blobScales = [this.rNorm * 1 / 24, this.rNorm * 0.8 / 24, this.rNorm * 0.7 / 24, this.rNorm * 0.5 / 24]

      // let dishScale = this.dishSize / this.dish.radius
      // let blobScale = 1 + (dishScale - 1) * 0.66667

      // this.blobs.forEach((blob) => {
      //   blob.resize(blobScale)
      // })

      this.blobs.forEach((blob, key) => {
        blob.dishSize = dishSize
        blob.dishOrigin = dishOrigin
        blob.scaleTo(this.blobScales[key])
      })

      this.dish.resizeTo(this.dishSize)
      this.dishOuter.resizeTo(this.dishSize + 4)
    }
  }

  mousemove(event) {
    if (this.initialized) {
      let offsetLeft = offset(this.wrapper).left
      let mouse = {
        x: event.clientX - offsetLeft,
        y: event.clientY
      }

      this.blobs.forEach((blob, key) => {
        if (blob.isInside(mouse)) {
          if (key != this.overblob) {
            this.randomizeScales(key)

            let mouseoverEvent = new CustomEvent('mouseover', {
              detail: {
                message: 'mouseover',
                blobIndex: key
              }
            })
            this.wrapper.dispatchEvent(mouseoverEvent)
          }
          
          this.overblob = key
        }
      })
    }
    return false;
  }

  destroy() {
    window.removeEventListener('resize', this.throttledResize, false)
    this.wrapper.removeEventListener('mousemove', this.throttledMousemove, false)

    this.stop()
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
    if (this.initialized) {
      this.randomizeScales()
    }
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

            // let scale = this.dishSize / 24 * 0.65
            // this.scaleBlob(index, scale)

            this.highlightBlob(index)
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
      let activateEvent = new CustomEvent('activated', {
        detail: {
          message: 'activated',
          slug: this.embassies[this.currentBlob].slug
        }
      })
      this.wrapper.dispatchEvent(activateEvent)
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

  animate() {
    if (this.isRunning) {
      window.requestAnimationFrame(this.animate.bind(this))

      this.dish.update()
      this.dishOuter.update()

      this.throttleFPS.now = Date.now()
      this.throttleFPS.elapsed = this.throttleFPS.now - this.throttleFPS.then



      if (this.throttleFPS.elapsed > this.throttleFPS.fpsInterval) {

        this.throttleFPS.then =
          this.throttleFPS.now -
          this.throttleFPS.elapsed % this.throttleFPS.fpsInterval

        this.update()
        this.draw()
      }
    }
  }

  update() {
    if (!this.initialized) {
      if (
        this.blobsInitialized &&
        this.preloadedImages === this.embassies.length
      ) {
        this.initialized = true
        // this.wrapper.querySelector('#blob-svg-wrapper').style.opacity = 1
        let initEvent = new CustomEvent('initialized', {
          detail: {
            message: 'initialized'
          }
        })
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

    this.rotationTicker++
    if (this.rotationTicker > this.rotationTrigger) {
      this.rotationTrigger = Math.floor(Math.random() * 4) * 100 + 200
      this.rotationTicker = 0
      this.rotate()
    }
  }

  draw() {
    this.svgRenders.forEach((svgRender) => {
      svgRender.draw()
    })
  }

  randomizeScales(index = -1) {
    let indexes = []
    let randomScales = []

    if (index == - 1) {
      for (let i = 0; i < this.blobScales.length; i++) {
        indexes.push(i)
      }

      for (let i = 0; i < this.blobScales.length; i++) {
        let randomIndex = Math.floor(Math.random() * indexes.length)
        randomScales.push(this.blobScales[indexes[randomIndex]])
        indexes.splice(randomIndex, 1)
      }

      this.blobs.forEach((blob, key) => {
        blob.scaleTo(randomScales[key])
      })
    } else {
      for (let i = 1; i < this.blobScales.length; i++) {
        indexes.push(i)
      }

      // randomScales.push(this.blobScales[0])

      for (let i = 1; i < this.blobScales.length; i++) {
        let randomIndex = Math.floor(Math.random() * indexes.length)
        randomScales.push(this.blobScales[indexes[randomIndex]])
        indexes.splice(randomIndex, 1)
      }

      randomScales.splice(index, 0, this.blobScales[0])
    
      this.blobs.forEach((blob, key) => {
        blob.scaleTo(randomScales[key])
      })
    }
  }

  highlightBlob(index = -1) {
    let indexes = []
    let randomScales = []

    if (index == - 1) {
      return false
    } else {
      for (let i = 1; i < this.highlightScales.length; i++) {
        indexes.push(i)
      }

      for (let i = 1; i < this.highlightScales.length; i++) {
        let randomIndex = Math.floor(Math.random() * indexes.length)
        randomScales.push(this.highlightScales[indexes[randomIndex]])
        indexes.splice(randomIndex, 1)
      }

      randomScales.splice(index, 0, this.highlightScales[0])

      this.blobs.forEach((blob, key) => {
        blob.scaleTo(randomScales[key])
      })
    }
  }

  rotate() {
    let direction = (Math.random() > 0.5)
    console.log(direction)
    this.blobs.forEach(blob => {
      blob.dirRotation = direction
      blob.currRotation = 0;
      blob.targetRotation = 400;
      blob.isRotating = true;

      console.log(blob.state)
    })
  }

  scaleBlob(index, amount) {
    let relativeScale = amount / this.blobs[index].restScale

    this.blobs.forEach((blob, key) => {
      if (key === index) {
        blob.scaleTo(amount)
      } else {
        let negativeAmount = 1 / relativeScale
        let normalized = 1 - ((1 - negativeAmount) / 2)
        let scale = blob.restScale * normalized
        blob.scaleTo(scale)
      }
    })
  }

  setBlobBackground(index, image) {
    this.svgRenders[index].setBackgroundImage(image)
  }
}
;(function() {
  if (typeof window.CustomEvent === 'function') return false

  function CustomEvent(event, params) {
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: null
    }
    var evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  window.CustomEvent = CustomEvent
})()

function offset(el) {
  var rect = el.getBoundingClientRect(),
  scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

export default MatterApp
