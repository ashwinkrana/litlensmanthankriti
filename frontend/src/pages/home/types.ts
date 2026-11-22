export type HomeProps = {
  demoTopics: string[]
  onStart: (topic: string, deck: number) => void
  busy: boolean
}
