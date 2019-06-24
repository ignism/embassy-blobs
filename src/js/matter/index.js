import MatterApp from './app'

const wrapper = document.getElementById('blob-app')
const matterApp = new MatterApp(wrapper, 4, true)

matterApp.init()

function animation () {
  matterApp.update()
  matterApp.draw()
  window.requestAnimationFrame(animation)
}

window.requestAnimationFrame(animation)