import { fragmentShader, vertexShader } from './shaders'

const MAX_DPR = 1.5 // never render above 1.5x, even on dense screens
const RENDER_SCALE = 0.5 // silk is all soft shapes, so half resolution scales up invisibly
const MAX_DELTA = 0.05 // longest time step (s), so a stall can't cause a jump
const FRAME_MS = 1000 / 45 // cap at 45 fps; it's a background

export type SilkPalette = {
  base: [number, number, number]
  tintA: [number, number, number]
  tintB: [number, number, number]
  tintC: [number, number, number]
  glintColor: [number, number, number]
  tintMix: number
  shadeFloor: number
  shadeGain: number
  glint: number
}

export type SilkEngine = {
  setPalette: (p: SilkPalette) => void
  /** false: draw one still frame and ignore the pointer. */
  setAnimate: (on: boolean) => void
  dispose: () => void
}

/** Returns null when WebGL is unavailable; the CSS gradient behind the canvas then shows. */
export function createSilkEngine(
  canvas: HTMLCanvasElement,
  palette: SilkPalette,
  animate: boolean,
  onLost: () => void,
): SilkEngine | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' })
  if (!gl) return null

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }
  const vs = compile(gl.VERTEX_SHADER, vertexShader)
  const fs = compile(gl.FRAGMENT_SHADER, fragmentShader)
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  gl.useProgram(program)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const uRes = u('uRes')
  const uTime = u('uTime')
  const uMouse = u('uMouse')
  const uBase = u('uBase')
  const uTintA = u('uTintA')
  const uTintB = u('uTintB')
  const uTintC = u('uTintC')
  const uGlintColor = u('uGlintColor')
  const uTintMix = u('uTintMix')
  const uShadeFloor = u('uShadeFloor')
  const uShadeGain = u('uShadeGain')
  const uGlint = u('uGlint')

  // One oversized triangle covers the screen with fewer vertices than a quad.
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  let time = 7 // start part-way in so the first frame is already a good shape
  let last = 0
  let raf = 0
  let running = false
  let onScreen = true
  let disposed = false
  let lost = false
  let animating = animate
  // Light starts above the screen, so it's neutral until the pointer moves.
  const target = { x: 0.5, y: 1.2 }
  const mouse = { x: 0.5, y: 1.2 }

  const applyPalette = (p: SilkPalette) => {
    gl.uniform3fv(uBase, p.base)
    gl.uniform3fv(uTintA, p.tintA)
    gl.uniform3fv(uTintB, p.tintB)
    gl.uniform3fv(uTintC, p.tintC)
    gl.uniform3fv(uGlintColor, p.glintColor)
    gl.uniform1f(uTintMix, p.tintMix)
    gl.uniform1f(uShadeFloor, p.shadeFloor)
    gl.uniform1f(uShadeGain, p.shadeGain)
    gl.uniform1f(uGlint, p.glint)
  }

  const draw = () => {
    if (lost || disposed) return
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, time)
    gl.uniform2f(uMouse, mouse.x, mouse.y)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, MAX_DPR) * RENDER_SCALE
    const width = Math.max(1, Math.round(canvas.clientWidth * scale))
    const height = Math.max(1, Math.round(canvas.clientHeight * scale))
    if (canvas.width === width && canvas.height === height) return
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
    draw() // a paused page is never left blank
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (now - last < FRAME_MS) return
    const delta = Math.min((now - last) / 1000, MAX_DELTA)
    last = now
    time += delta
    // Ease the light toward the pointer so the sheen feels weighty.
    mouse.x += (target.x - mouse.x) * 0.06
    mouse.y += (target.y - mouse.y) * 0.06
    draw()
  }

  const updateRunning = () => {
    const shouldRun = animating && onScreen && !document.hidden && !disposed && !lost
    if (shouldRun === running) return
    running = shouldRun
    if (running) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    } else {
      cancelAnimationFrame(raf)
    }
  }

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !animating) return
    target.x = e.clientX / window.innerWidth
    target.y = 1 - e.clientY / window.innerHeight // GLSL measures from the bottom
  }

  const onContextLost = (e: Event) => {
    e.preventDefault()
    lost = true
    cancelAnimationFrame(raf)
    running = false
    onLost()
  }

  const resizeObserver = new ResizeObserver(resize)
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    updateRunning()
  })
  resizeObserver.observe(canvas)
  intersectionObserver.observe(canvas)
  document.addEventListener('visibilitychange', updateRunning)
  canvas.addEventListener('webglcontextlost', onContextLost)
  window.addEventListener('pointermove', onPointer, { passive: true })

  applyPalette(palette)
  resize()
  draw()
  updateRunning()

  return {
    setPalette(p) {
      applyPalette(p)
      draw()
    },
    setAnimate(on) {
      animating = on
      if (!on) {
        // Settle the light back to neutral for the still frame.
        mouse.x = target.x = 0.5
        mouse.y = target.y = 1.2
        draw()
      }
      updateRunning()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', updateRunning)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('pointermove', onPointer)
      gl.deleteProgram(program)
      gl.deleteBuffer(buffer)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
