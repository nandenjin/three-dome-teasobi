import {
  WebGLRenderer,
  Scene,
  Mesh,
  MeshPhongMaterial,
  DirectionalLight,
  AmbientLight,
  TorusKnotGeometry,
  GridHelper,
  PerspectiveCamera,
  AxesHelper,
} from 'three'

// @ts-ignore
import Stats from 'stats-js'
import GUI from 'lil-gui'
import { DomeMasterCamera } from './DomeMasterCamera'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { DomeMasterCameraHelper } from './DomeMasterCameraHelper'

const params = {
  useDomemaster: true,
}
const gui = new GUI()
gui.add(params, 'useDomemaster')

const scene = new Scene()

const createSampleObject = (x: number, y: number, z: number, color: number) => {
  const mesh = new Mesh(
    new TorusKnotGeometry(),
    new MeshPhongMaterial({ color })
  )
  mesh.position.set(x, y, z)
  return mesh
}

const objects = [
  createSampleObject(0, 3, 0, 0x00ff00),
  createSampleObject(3, 0, 0, 0xff0000),
  createSampleObject(0, 0, 3, 0x0000ff),
  createSampleObject(-3, 0, 0, 0xffffff),
  createSampleObject(0, -3, 0, 0xffffff),
  createSampleObject(0, 0, -3, 0xffffff),
]
for (const object of objects) {
  scene.add(object)
}

const grid = new GridHelper(50, 25, 0xffffff, 0x00ff00)
grid.position.set(0, 3, 0)
scene.add(grid)

scene.add(new AxesHelper(10))

const mainLight = new DirectionalLight(0xffffff, 1)
mainLight.lookAt(-1, 0.5, -1)
scene.add(mainLight)
scene.add(new AmbientLight(0xffffff, 0.7))

const renderer = new WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

const stats = new Stats()
document.body.appendChild(stats.dom)

const domeCamera = new DomeMasterCamera()
domeCamera.lookAt(1, 0, 0)
scene.add(domeCamera)

const domeCameraHelper = new DomeMasterCameraHelper(domeCamera)
scene.add(domeCameraHelper)

const debugCamera = new PerspectiveCamera(60)
debugCamera.position.set(3, 3, 3)
debugCamera.lookAt(0, 0, 0)
scene.add(debugCamera)
const debugCameraControl = new OrbitControls(debugCamera, renderer.domElement)

function render() {
  requestAnimationFrame(render)
  stats.begin()

  for (const object of objects) {
    object.rotation.x += 0.01
    object.rotation.y += 0.01
  }

  const size = Math.min(window.innerWidth, window.innerHeight)
  renderer.setSize(size, size)

  domeCameraHelper.visible = !params.useDomemaster
  domeCameraHelper.update()

  if (params.useDomemaster) {
    domeCamera.renderWith(scene, renderer)
  } else {
    debugCameraControl.update()
    renderer.render(scene, debugCamera)
  }

  stats.end()
}
render()
