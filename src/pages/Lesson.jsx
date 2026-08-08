// Lesson player (fleshed out in Stage 2).
import { useParams } from "react-router-dom";
export default function Lesson() {
  const { signId } = useParams();
  return (
    <main className="page">
      <h1>Lesson: {signId}</h1>
      <p>Split lesson layout — coming in Stage 2.</p>
    </main>
  );
}
