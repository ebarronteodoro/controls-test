import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Sky } from '@react-three/drei'
import * as THREE from 'three'

const CubeModel = (props) => {
  const { scene } = useGLTF('/cube_n_light.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.geometry.computeVertexNormals()
      }
    })
  }, [scene])

  return <primitive object={scene} {...props} scale={[0.3, 0.3, 0.3]} />
}

const FloorModel = (props) => {
  const { scene } = useGLTF('/plane.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = true
      }
    })
  }, [scene])

  return <primitive object={scene} {...props} />
}

// Componente Scene donde manipulamos la cámara
const Scene = forwardRef((props, ref) => {
  const cameraRef = useRef()
  const isAnimating = useRef(false)

  // Exponemos las funciones de control de cámara hacia el componente padre
  useImperativeHandle(ref, () => ({
    rotateCameraLeft: () => {
      rotateCamera(1.0) // Aumenta la rotación a 1 radian
    },
    rotateCameraRight: () => {
      rotateCamera(-1.0) // Aumenta la rotación a -1 radian
    }
  }))

  const rotateCamera = (angle) => {
    const camera = cameraRef.current
    if (!camera || isAnimating.current) return

    // Aplicamos la rotación a la cámara
    const targetPosition = camera.position.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)

    // Suavizamos la transición de la posición de la cámara
    isAnimating.current = true
    const animate = () => {
      camera.position.lerp(targetPosition, 0.1) // Incrementa el lerp para transiciones más rápidas
      camera.lookAt(0, 0, 0)
      if (camera.position.distanceTo(targetPosition) > 0.01) {
        requestAnimationFrame(animate)
      } else {
        isAnimating.current = false
      }
    }
    animate()
  }

  return (
    <Canvas shadows camera={{ position: [5, 5, 5], fov: 75 }} onCreated={({ camera }) => (cameraRef.current = camera)}>
      <OrbitControls />
      <Sky />
      <ambientLight intensity={0.5} />
      <directionalLight
        color="#fade85"
        position={[5, 10, 5]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      <CubeModel position={[-5, 0, 0]} />
      <mesh rotation={[0, 0, 0]} position={[5, 6, 0]} castShadow>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="#777777" />
      </mesh>
      <FloorModel position={[0, 0, 0]} />
    </Canvas>
  )
})

const App = () => {
  const sceneRef = useRef()

  return (
    <div style={{ position: 'relative' }}>
      {/* Componente de la escena */}
      <Scene ref={sceneRef} />

      {/* Botones para controlar la rotación de la cámara */}
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <button onClick={() => sceneRef.current.rotateCameraLeft()}>Rotar Izquierda</button>
        <button onClick={() => sceneRef.current.rotateCameraRight()}>Rotar Derecha</button>
      </div>
    </div>
  )
}

export default App
