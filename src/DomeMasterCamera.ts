import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'

type Direction = number

export class DomeMasterCamera extends Object3D {
  /** Cameras for each directions */
  private cameras: PerspectiveCamera[] = []
  /** RenderTargets to save rendered results for each directions */
  private renderTargets: WebGLRenderTarget[] = []
  /** Internal scene to render final result */
  private domeScene = new Scene()
  /** Internal camera to render final result */
  private domeCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

  /**
   * @example
   * const scene = new Scene()
   * const camera = new DomeMasterCamera()
   * camera.position.set(0, 0, 0)
   * canera.lookAt(0, 1, 0)
   * scene.add(camera)
   *
   * const renderer = new WebGLRenderer()
   * document.body.appendChild(renderer.domElement)
   *
   * // In render loop:
   * camera.renderWith(scene, renderer)
   *
   * @param near Camera frustum near plane. Default `0.1`.
   * @param far Camera frustum far plane. Default `1000`.
   * @param size Size of face of internal cubemap. Default `1024`.
   */
  constructor(near = 0.1, far = 1000, size = 1024) {
    super()

    /*
     * This camera renders the scene given in domemaster format by:
     * 1. Renders with 5 cameras corresponding to the 5 faces of the cubemap excluding -Y
     * 2. Renders the another scene contains a sphere wrapped by the output images from previous step
     */

    const cameraGroup = new Group()

    // For each face of cubemap:
    for (let direction = 0; direction < 5; direction++) {
      // Create camera
      const camera = new PerspectiveCamera(90, 1, near, far)

      // Transform to match each directions
      switch (direction) {
        case 0: // +Y
          camera.lookAt(0, 1, 0)
          break
        case 1: // +X
          camera.lookAt(1, 0, 0)
          break
        case 2: // +Z
          camera.lookAt(0, 0, 1)
          break
        case 3: // -X
          camera.lookAt(-1, 0, 0)
          break
        case 4: // -Z
          camera.lookAt(0, 0, -1)
          break
      }
      cameraGroup.add(camera)
      this.cameras[direction] = camera

      // Create render target
      const renderTarget = new WebGLRenderTarget(size, size)
      this.renderTargets[direction] = renderTarget

      // Create mesh to compose dome
      const cubeMapGeometry = createCubeMapGeometry(direction)
      const cubeMapMaterial = new MeshBasicMaterial({
        color: 0xffffff,
        map: renderTarget.texture,
      })
      const cubeMapMesh = new Mesh(cubeMapGeometry, cubeMapMaterial)
      this.domeScene.add(cubeMapMesh)
    }

    cameraGroup.rotateY(Math.PI) // To match result of lookAt()
    this.add(cameraGroup)

    // Prepare camera to take final result
    this.domeCamera.lookAt(0, 1, 0)
    this.domeScene.add(this.domeCamera)
  }

  /**
   * Render the given scene to the given WebGLRenderer.
   * @param scene
   * @param renderer
   */
  renderWith(scene: Scene, renderer: WebGLRenderer): void {
    const originalRenderTarget = renderer.getRenderTarget()

    for (let direction = 0; direction < 5; direction++) {
      renderer.setRenderTarget(this.renderTargets[direction])
      renderer.render(scene, this.cameras[direction])
    }
    renderer.setRenderTarget(originalRenderTarget)
    renderer.render(this.domeScene, this.domeCamera)
  }
}

/**
 * Create geometry for conversion from a face of cubemap to dome
 * @param direction Index of face of cubemap. `0`-`4`
 * @param resolution Default `32`
 * @returns `BufferGeometry` represents a part of dome (radius = 2)
 */
function createCubeMapGeometry(
  direction: Direction,
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
    case 1: // +X
      geometry.rotateY(Math.PI / 2)
      break
    case 3: // -X
      geometry.rotateY(-Math.PI / 2)
      break
    case 0: // +Y
      geometry.rotateZ(Math.PI)
      geometry.rotateX(-Math.PI / 2)
      break
    case 2: // +Z
      break
    case 4: // -Z
      geometry.rotateY(Math.PI)
      break
  }

  return geometry
}
