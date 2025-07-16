import Button from '../components/ui/Button'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-content1 p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-foreground mb-6">About</h1>
        <p className="text-foreground/60 mb-6">
          This is a demo project showcasing React with Vite, TailwindCSS, and HeroUI components.
        </p>
        <Link to="/home">
          <Button variant="primary">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
