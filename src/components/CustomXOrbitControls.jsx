import React, { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const CustomXOrbitControls = ({
  rotateSpeed = 0.005, // Velocidad de rotación
  dampingFactor = 0.1, // Factor de damping para suavidad
  initialDistance = 10 // Distancia fija entre la cámara y el objeto
}) => {
  const { camera, gl } = useThree()

  const state = useRef({
    isDragging: false,
    mouseStart: new THREE.Vector2(),
    spherical: new THREE.Spherical(initialDistance, Math.PI / 2, 0), // Iniciamos con un radio fijo
    sphericalDelta: new THREE.Spherical(),
    target: new THREE.Vector3(0, 0, 0) // Punto de enfoque (el centro del objeto)
  })

  // Mantener la distancia de la cámara constante desde el objeto
  useEffect(() => {
    const offset = new THREE.Vector3()
    offset.copy(camera.position).sub(state.current.target)
    state.current.spherical.setFromVector3(offset)
    state.current.spherical.radius = initialDistance // Mantener el radio constante
  }, [camera.position, initialDistance])

  // Manejo de eventos del mouse
  const onMouseDown = event => {
    event.preventDefault()
    state.current.isDragging = true
    state.current.mouseStart.set(event.clientX, event.clientY)
  }

  const onMouseMove = event => {
    if (!state.current.isDragging) return

    const deltaX = event.clientX - state.current.mouseStart.x

    // Actualizar solo el ángulo theta para orbitar horizontalmente
    state.current.sphericalDelta.theta -= deltaX * rotateSpeed

    state.current.mouseStart.set(event.clientX, event.clientY)
  }

  const onMouseUp = () => {
    state.current.isDragging = false
  }

  const onContextMenu = event => {
    event.preventDefault() // Deshabilitar el menú contextual
  }

  useEffect(() => {
    const domElement = gl.domElement

    domElement.addEventListener('mousedown', onMouseDown)
    domElement.addEventListener('mousemove', onMouseMove)
    domElement.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('contextmenu', onContextMenu)

    return () => {
      domElement.removeEventListener('mousedown', onMouseDown)
      domElement.removeEventListener('mousemove', onMouseMove)
      domElement.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl.domElement])

  useFrame(() => {
    const { spherical, sphericalDelta, target } = state.current

    spherical.theta += sphericalDelta.theta

    // Convertir las coordenadas esféricas a cartesianas
    const newPosition = new THREE.Vector3()
    newPosition.setFromSpherical(spherical).add(target)

    // Fijar la distancia al radio inicial, evitando que se "aleje" o "acerque" por el movimiento rápido
    newPosition.setLength(initialDistance)

    // Actualizamos la posición de la cámara, solo con interpolación de rotación
    camera.position.lerp(newPosition, dampingFactor)
    camera.lookAt(target)

    // Reducir el delta de theta (damping)
    sphericalDelta.theta *= 1 - dampingFactor
  })

  return null
}

export default CustomXOrbitControls
