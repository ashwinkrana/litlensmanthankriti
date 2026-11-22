/**
 * Fades out the boot loader from index.html once the app has painted and its
 * fonts are in (so the swap from the fallback font happens under the loader),
 * waiting at most MAX_WAIT so a slow font never holds the app back.
 */
const MAX_WAIT = 900

let done = false

export function hideBootLoader(): void {
  if (done) return
  done = true
  const boot = document.getElementById('boot')
  if (!boot) return
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT))
  void Promise.race([fonts, timeout]).then(() => {
    requestAnimationFrame(() => {
      boot.classList.add('boot-done')
      // remove after the fade (or right away if transitions are off)
      setTimeout(() => boot.remove(), 400)
    })
  })
}
