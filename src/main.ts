import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AxesHelper,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  LinearMipMapLinearFilter,
  WebGLRenderTarget,
  BufferGeometry,
  Float32BufferAttribute,
  TextureLoader,
  MeshPhongMaterial,
  DirectionalLight,
  AmbientLight,
  OrthographicCamera,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

// @ts-ignore
import Stats from 'stats-js'

enum CubeMapFaceDirection {
  PX,
  NX,
  PY,
  NY,
  PZ,
  NZ,
}

const directions = [
  CubeMapFaceDirection.NX,
  CubeMapFaceDirection.NZ,
  CubeMapFaceDirection.PX,
  CubeMapFaceDirection.PY,
  CubeMapFaceDirection.PZ,
]
const faceSize = 512

const scene = new Scene()

const cubeRenderTargets: Partial<
  Record<CubeMapFaceDirection, WebGLRenderTarget>
> = {}
for (const direction of directions) {
  cubeRenderTargets[direction] = new WebGLRenderTarget(faceSize, faceSize, {})
}

const boxes: Mesh[] = []
for (let i = 0; i < 20; i++) {
  const geometry = new BoxGeometry(1, 1, 1)
  const material = new MeshPhongMaterial({ color: 0xff0000 })
  const mesh = new Mesh(geometry, material)
  mesh.position.set(
    (Math.random() * 2 - 1) * 3,
    (Math.random() * 2 - 1) * 3,
    (Math.random() * 2 - 1) * 3
  )
  boxes.push(mesh)
  scene.add(mesh)
}

const dl = new DirectionalLight(0xffffff, 1)
dl.lookAt(0, -1, 0.5)
scene.add(dl)
scene.add(new AmbientLight(0xffffff, 0.5))

const renderer = new WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const stats = new Stats()
document.body.appendChild(stats.dom)

const resultScene = new Scene()

for (const dir of directions) {
  const geometry = createCubeMapGeometry(dir)
  const material = new MeshBasicMaterial({
    color: 0xffffff,
    // wireframe: true,
    map: cubeRenderTargets[dir]?.texture,
    // map: new TextureLoader().load('/controller.jpg'),
  })
  const mesh = new Mesh(geometry, material)
  resultScene.add(mesh)
}

const cubeCamera = new PerspectiveCamera(90, 1, 0.1, 100)
scene.add(cubeCamera)

// const camera = new PerspectiveCamera()
// camera.position.set(3, 3, 3)
// camera.lookAt(0, 0, 0)
// const orbitControl = new OrbitControls(camera, renderer.domElement)
const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
camera.lookAt(0, 1, 0)

const axesHelper = new AxesHelper(10)
resultScene.add(axesHelper)

function render() {
  requestAnimationFrame(render)
  stats.begin()
  // orbitControl.update()
  for (const box of boxes) {
    box.rotation.x += 0.01
    box.rotation.y += 0.01
  }
  for (const dir of directions) {
    renderer.setRenderTarget(cubeRenderTargets[dir] ?? null)
    renderer.setSize(faceSize, faceSize)

    cubeCamera.position.set(0, 0, 0)
    switch (dir) {
      case CubeMapFaceDirection.PX:
        cubeCamera.lookAt(1, 0, 0)
        break
      case CubeMapFaceDirection.NX:
        cubeCamera.lookAt(-1, 0, 0)
        break
      case CubeMapFaceDirection.PY:
        cubeCamera.lookAt(0, 1, 0)
        break
      case CubeMapFaceDirection.NY:
        cubeCamera.lookAt(0, -1, 0)
        break
      case CubeMapFaceDirection.PZ:
        cubeCamera.lookAt(0, 0, 1)
        break
      case CubeMapFaceDirection.NZ:
        cubeCamera.lookAt(0, 0, -1)
        break
    }
    renderer.render(scene, cubeCamera)
  }

  renderer.setRenderTarget(null)
  renderer.setSize(window.innerWidth, window.innerHeight)
  // camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.render(resultScene, camera)
  stats.end()
}

function createCubeMapGeometry(
  direction: CubeMapFaceDirection,
  resolution = 32
): BufferGeometry {
  const geometry = new BufferGeometry()

  const indices = []
  for (let v = 0; v < resolution; v++) {
    for (let h = 0; h < resolution; h++) {
      const index = v * (resolution + 1) + h
      indices.push(index, index + 1, index + resolution + 1)
      indices.push(index + 1, index + resolution + 2, index + resolution + 1)
    }
  }
  geometry.setIndex(indices)

  const vertices = new Float32Array((resolution + 1) * (resolution + 1) * 3)
  const uvs = new Float32Array((resolution + 1) * (resolution + 1) * 2)
  for (let v = 0; v <= resolution; v++) {
    for (let h = 0; h <= resolution; h++) {
      const index = v * (resolution + 1) + h
      const UVu = v / resolution,
        UVv = h / resolution
      const x = UVu * 2 - 1,
        y = UVv * 2 - 1,
        z = 1
      const l = Math.sqrt(x * x + y * y + z * z)
      vertices[index * 3 + 0] = x / l
      vertices[index * 3 + 1] = y / l
      vertices[index * 3 + 2] = z / l
      uvs[index * 2 + 0] = 1 - UVu
      uvs[index * 2 + 1] = UVv
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))

  switch (direction) {
    case CubeMapFaceDirection.PX:
      geometry.rotateY(Math.PI / 2)
      break
    case CubeMapFaceDirection.NX:
      geometry.rotateY(-Math.PI / 2)
      break
    case CubeMapFaceDirection.PY:
      geometry.rotateZ(Math.PI)
      geometry.rotateX(-Math.PI / 2)
      break
    case CubeMapFaceDirection.NY:
      geometry.rotateX(Math.PI / 2)
      break
    case CubeMapFaceDirection.PZ:
      break
    case CubeMapFaceDirection.NZ:
      geometry.rotateY(Math.PI)
      break
  }

  return geometry
}

render()
