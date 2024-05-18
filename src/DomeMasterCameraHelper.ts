import {
  ArrowHelper,
  Color,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three'
import type { DomeMasterCamera } from './DomeMasterCamera'

export class DomeMasterCameraHelper extends Object3D {
  camera: DomeMasterCamera
  private dome: LineSegments
  private arrow: ArrowHelper

  constructor(camera: DomeMasterCamera) {
    super()

    const geometry = new SphereGeometry(
      1,
      16,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    )
    const material = new LineBasicMaterial({
      color: 0xffffff,
    })

    const dome = new LineSegments(geometry, material)
    this.add(dome)
    this.dome = dome

    const arrow = new ArrowHelper(
      new Vector3(0, 0, 1),
      new Vector3(0, 0, 0),
      2,
      0xffffff
    )
    this.add(arrow)
    this.arrow = arrow

    this.camera = camera
    this.update()
  }

  update(): void {
    this.position.copy(this.camera.position)
    this.rotation.copy(this.camera.rotation)
  }

  setColors(hex: Color): this {
    ;(this.dome.material as LineBasicMaterial).color = hex
    this.arrow.setColor(hex)

    return this
  }
}
