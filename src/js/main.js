import MatterApp from './matter'

const embassies = [
  { slug: 'slug-1', image: 'background.jpg' },
  { slug: 'slug-2', image: 'background.jpg' }
]
const wrapper = document.getElementById('blob-app')
const matterApp = new MatterApp(wrapper, embassies, 4)

matterApp.init()