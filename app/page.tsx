import { Counter } from './counter'

// Enough content that the inline Flight payload spans several <script> chunks,
// like any real page.
const paragraphs = Array.from({ length: 400 }, (_, i) => `Paragraph ${i}: lorem ipsum dolor sit amet.`)

export default function Page() {
  return (
    <main>
      <h1>Truncated HTML repro</h1>
      <Counter />
      {paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </main>
  )
}
