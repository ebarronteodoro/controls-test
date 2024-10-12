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
  const zoomDistance = useRef(30) // Distancia inicial de la cámara (zoom)
  const angleRef = useRef(Math.PI / 2) // Ajuste del ángulo para comenzar a lo largo del eje X
  const targetAngleRef = useRef(Math.PI / 2) // Ángulo objetivo
  const isAnimating = useRef(false)
  const isDragging = useRef(false)
  const previousMouseX = useRef(0)
  const previousMouseY = useRef(0)

  const cameraHeight = useRef(15) // Altura inicial (referencia mutable)

  const zoomSpeed = 0.1 // Velocidad de la animación de zoom

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

  // Actualiza el ángulo objetivo cuando se rota la cámara
  const updateTargetAngle = deltaAngle => {
    targetAngleRef.current += deltaAngle
    animateCameraRotation()
  }

  // Función para animar la rotación de la cámara
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
    const targetZoom = THREE.MathUtils.clamp(
      zoomDistance.current + delta,
      20,
      50
    ) // Limitar el zoom

    const zoomAnimate = () => {
      zoomDistance.current += (targetZoom - zoomDistance.current) * zoomSpeed

      const x = zoomDistance.current * Math.sin(angleRef.current)
      const z = zoomDistance.current * Math.cos(angleRef.current)

      cameraRef.current.position.set(x, cameraHeight.current, z)
      cameraRef.current.lookAt(0, 5, 0)

      if (Math.abs(targetZoom - zoomDistance.current) > 0.1) {
        requestAnimationFrame(zoomAnimate)
      }
    }

    zoomAnimate()
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

  useEffect(() => {
    const camera = cameraRef.current
    if (camera) {
      const x = zoomDistance.current * Math.sin(angleRef.current)
      const z = zoomDistance.current * Math.cos(angleRef.current)

      camera.position.set(x, cameraHeight.current, z)
      camera.lookAt(0, 5, 0)
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
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
        <button onClick={() => sceneRef.current.rotateCameraRight()}>
          Rotar Izquierda
        </button>
        <button onClick={() => sceneRef.current.rotateCameraLeft()}>
          Rotar Derecha
        </button>
        <button onClick={() => sceneRef.current.zoomIn()}>Acercar</button>
        <button onClick={() => sceneRef.current.zoomOut()}>Alejar</button>
      </div>
    </div>
  )
}

export default App
