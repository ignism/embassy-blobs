import MatterApp from './matter'
import '../css/matter-app.css'

const embassies = [
  {
    slug: 'embassy-1',
    // image: 'https://images.unsplash.com/photo-1561972661-8b9a2ace559a'
    image: 'images/embassy-0.jpg'
  },
  {
    slug: 'embassy-2',
    // image: 'https://images.unsplash.com/photo-1561913620-d9801a50ba88'
    image: 'images/embassy-1.jpg'
  },
  {
    slug: 'embassy-3',
    // image: 'https://images.unsplash.com/photo-1561972663-4210a74d4175'
    image: 'images/embassy-2.jpg'
  }
]

const patterns = [
  {
    image: 'images/pattern-0.png'
  },
  {
    image: 'images/pattern-1.png'
  },
  {
    image: 'images/pattern-2.png'
  },
  {
    image: 'images/pattern-3.png'
  }
]

const wrapper = document.getElementById('blob-app')
const matterApp = new MatterApp(wrapper, embassies, patterns, 4, false)
const embassyDetail = document.querySelector('.embassy-detail')
const buttonBack = embassyDetail.querySelector('.button-back')
const buttonActivate = embassyDetail.querySelector('.button-activate')

wrapper.addEventListener('initialized', (event) => {
  console.log(event.detail)
})

wrapper.addEventListener('activated', (event) => {
  console.log(event.detail)
})

wrapper.addEventListener('mouseover', (event) => {
  console.log(event.detail)
})


buttonBack.addEventListener('click', (event) => {
  event.preventDefault()

  embassyDetail.classList.add('hidden')
  matterApp.reset()
})

buttonActivate.addEventListener('click', (event) => {
  event.preventDefault()

  if (matterApp.activate()) {
    // matterApp.activate() returned true als hij succesvel heeft weten te activeren
    // dus je kan dit gebruiken om door te gaan naar volgende pagina
    // anders luisteren naar event 'activated' op de wrapper (#blob-app)
  }
})

let triggers = Array.from(document.querySelectorAll('.blob-trigger'))
triggers.forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault()

    let slug = trigger.getAttribute('data-slug')

    if (slug) {
      if (matterApp.highlight(slug)) {
        // matterApp.highlight() returned true als hij succesvel heeft weten te highlighten
        embassyDetail.querySelector('h1').innerText = slug
        embassyDetail.classList.remove('hidden')
      }
    }
  })

  trigger.addEventListener('mouseenter', (event) => {
    event.preventDefault()

    let slug = trigger.getAttribute('data-slug')

    matterApp.hover()
  })
})

matterApp.init()
