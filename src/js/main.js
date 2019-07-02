import MatterApp from './matter'

const embassies = [
  {
    slug: 'embassy-1',
    image: 'https://images.unsplash.com/photo-1561972661-8b9a2ace559a'
  },
  {
    slug: 'embassy-2',
    image: 'https://images.unsplash.com/photo-1561913620-d9801a50ba88'
  },
  {
    slug: 'embassy-3',
    image: 'https://images.unsplash.com/photo-1561972663-4210a74d4175'
  }
]
const wrapper = document.getElementById('blob-app')
const matterApp = new MatterApp(wrapper, embassies, 4)
const embassyDetail = document.querySelector('.embassy-detail')
const buttonBack = embassyDetail.querySelector('.button-back')

buttonBack.addEventListener('click', event => {
  event.preventDefault()

  embassyDetail.classList.add('hidden')
  matterApp.reset()
})

let triggers = Array.from(document.querySelectorAll('.blob-trigger'))
triggers.forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault()

    let slug = trigger.getAttribute('data-slug')

    if (slug) {
      matterApp.highlight(slug)
    
      embassyDetail.querySelector('h1').innerText = slug
      embassyDetail.classList.remove('hidden')
    }
  })
})

matterApp.init()