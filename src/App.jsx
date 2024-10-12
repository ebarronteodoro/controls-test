import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

const CubeModel = props => {
  const { scene } = useGLTF('/edificio.glb')

  useEffect(() => {
    scene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.geometry.computeVertexNormals()
      }
    })
  }, [scene])

  return <primitive object={scene} {...props} scale={[0.3, 0.3, 0.3]} />
}

const FloorModel = props => {
  const { scene } = useGLTF('/todooo.glb')

  useEffect(() => {
    scene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return <primitive object={scene} {...props} scale={[0.2, 0.2, 0.2]} />
}

const Scene = forwardRef((props, ref) => {
  const cameraRef = useRef()
  const zoomDistance = useRef(30)
  const angleRef = useRef(Math.PI / 2)
  const targetAngleRef = useRef(Math.PI / 2)
  const targetZoomDistance = useRef(zoomDistance.current)
  const isAnimating = useRef(false)
  const isDragging = useRef(false)
  const previousMouseX = useRef(0)
  const previousMouseY = useRef(0)
  const pinchStartDistance = useRef(0)

  const cameraHeight = useRef(15)
  const zoomSpeed = 0.1

  useImperativeHandle(ref, () => ({
    rotateCameraLeft: () => {
      updateTargetAngle(0.2)
    },
    rotateCameraRight: () => {
      updateTargetAngle(-0.2)
    },
    zoomIn: () => {
      animateZoom(-2)
    },
    zoomOut: () => {
      animateZoom(2)
    }
  }))

  const updateTargetAngle = deltaAngle => {
    targetAngleRef.current += deltaAngle
    animateCameraRotation()
  }

  const animateCameraRotation = () => {
    if (isAnimating.current) return

    const animate = () => {
      angleRef.current += (targetAngleRef.current - angleRef.current) * 0.1
      const x = zoomDistance.current * Math.sin(angleRef.current)
      const z = zoomDistance.current * Math.cos(angleRef.current)

      cameraRef.current.position.set(x, cameraHeight.current, z)
      cameraRef.current.lookAt(0, 5, 0)

      if (Math.abs(targetAngleRef.current - angleRef.current) > 0.01) {
        requestAnimationFrame(animate)
      } else {
        isAnimating.current = false
      }
    }

    if (!isAnimating.current) {
      isAnimating.current = true
      animate()
    }
  }

  const animateZoom = delta => {
    targetZoomDistance.current = THREE.MathUtils.clamp(
      targetZoomDistance.current + delta,
      15,
      50
    )

    const zoomAnimate = () => {
      zoomDistance.current +=
        (targetZoomDistance.current - zoomDistance.current) * zoomSpeed

      const x = zoomDistance.current * Math.sin(angleRef.current)
      const z = zoomDistance.current * Math.cos(angleRef.current)

      cameraRef.current.position.set(x, cameraHeight.current, z)
      cameraRef.current.lookAt(0, 5, 0)

      if (Math.abs(targetZoomDistance.current - zoomDistance.current) > 0.1) {
        requestAnimationFrame(zoomAnimate)
      }
    }

    requestAnimationFrame(zoomAnimate)
  }

  const handleMouseDown = event => {
    isDragging.current = true
    previousMouseX.current = event.clientX
    previousMouseY.current = event.clientY
  }

  const handleMouseMove = event => {
    if (!isDragging.current) return

    const deltaX = event.clientX - previousMouseX.current
    const deltaY = event.clientY - previousMouseY.current

    previousMouseX.current = event.clientX
    previousMouseY.current = event.clientY

    const rotationSpeed = 0.005
    updateTargetAngle(-deltaX * rotationSpeed)

    const verticalSpeed = 0.1
    cameraHeight.current = THREE.MathUtils.clamp(
      cameraHeight.current + deltaY * verticalSpeed,
      5,
      35
    )

    const x = zoomDistance.current * Math.sin(angleRef.current)
    const z = zoomDistance.current * Math.cos(angleRef.current)
    cameraRef.current.position.set(x, cameraHeight.current, z)
    cameraRef.current.lookAt(0, 5, 0)
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleWheel = event => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 2 : -2
    animateZoom(delta)
  }

  const getTouchDistance = touches => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = event => {
    event.preventDefault()
    if (event.touches.length === 1) {
      isDragging.current = true
      previousMouseX.current = event.touches[0].clientX
      previousMouseY.current = event.touches[0].clientY
    } else if (event.touches.length === 2) {
      pinchStartDistance.current = getTouchDistance(event.touches)
    }
  }

  const handleTouchMove = event => {
    event.preventDefault()
    if (event.touches.length === 1 && isDragging.current) {
      const deltaX = event.touches[0].clientX - previousMouseX.current
      const deltaY = event.touches[0].clientY - previousMouseY.current

      previousMouseX.current = event.touches[0].clientX
      previousMouseY.current = event.touches[0].clientY

      const rotationSpeed = 0.005
      updateTargetAngle(-deltaX * rotationSpeed)

      const verticalSpeed = 0.1
      cameraHeight.current = THREE.MathUtils.clamp(
        cameraHeight.current + deltaY * verticalSpeed,
        5,
        35
      )

      const x = zoomDistance.current * Math.sin(angleRef.current)
      const z = zoomDistance.current * Math.cos(angleRef.current)
      cameraRef.current.position.set(x, cameraHeight.current, z)
      cameraRef.current.lookAt(0, 5, 0)
    } else if (event.touches.length === 2) {
      const currentDistance = getTouchDistance(event.touches)
      const delta = pinchStartDistance.current - currentDistance
      animateZoom(delta * 0.02)
      pinchStartDistance.current = currentDistance
    }
  }

  const handleTouchEnd = () => {
    isDragging.current = false
  }

  useEffect(() => {
    const camera = cameraRef.current
    if (camera) {
      const x = zoomDistance.current * Math.sin(angleRef.current)
      const z = zoomDistance.current * Math.cos(angleRef.current)

      camera.position.set(x, cameraHeight.current, z)
      camera.lookAt(0, 5, 0)
    }

    // Deshabilitar gestos de navegador en toda la página excepto el canvas
    document.body.style.touchAction = 'none'

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('wheel', handleWheel, { passive: false })

    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.body.style.touchAction = '' // Restaurar el comportamiento por defecto al desmontar
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('wheel', handleWheel)

      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <Canvas
      gl={{ toneMappingExposure: 0.6 }}
      shadows
      onCreated={({ camera }) => {
        cameraRef.current = camera
        const x = zoomDistance.current * Math.sin(angleRef.current)
        const z = zoomDistance.current * Math.cos(angleRef.current)
        camera.position.set(x, cameraHeight.current, z)
        camera.lookAt(0, 5, 0)
      }}
    >
      <directionalLight
        position={[10, 20, 10]}
        intensity={2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <Environment files='/city_sky.hdr' background backgroundIntensity={0.2} />
      <FloorModel position={[3, 0, 4]} />
    </Canvas>
  )
})

const App = () => {
  const sceneRef = useRef()

  return (
    <div style={{ position: 'relative' }}>
      <Scene ref={sceneRef} />

      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <button
          onMouseDown={() => sceneRef.current.rotateCameraRight()}
          onTouchStart={() => sceneRef.current.rotateCameraRight()}
        >
          Rotar Izquierda
        </button>
        <button
          onMouseDown={() => sceneRef.current.rotateCameraLeft()}
          onTouchStart={() => sceneRef.current.rotateCameraLeft()}
        >
          Rotar Derecha
        </button>
        <button
          onMouseDown={() => sceneRef.current.zoomIn()}
          onTouchStart={() => sceneRef.current.zoomIn()}
        >
          Acercar
        </button>
        <button
          onMouseDown={() => sceneRef.current.zoomOut()}
          onTouchStart={() => sceneRef.current.zoomOut()}
        >
          Alejar
        </button>
      </div>
    </div>
  )
}

export default App
