import MatterApp from './app'

const wrapper = document.getElementById('matter-app')
const matterApp = new MatterApp(wrapper, 6)

matterApp.init()

function animation () {
  matterApp.update()
  matterApp.draw()
  window.requestAnimationFrame(animation)
}

window.requestAnimationFrame(animation)