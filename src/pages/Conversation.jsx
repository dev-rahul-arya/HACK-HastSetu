// Conversation screen (fleshed out in Stage 5).
import { useParams } from "react-router-dom";
export default function Conversation() {
  const { scenarioId } = useParams();
  return (
    <main className="page">
      <h1>Conversation: {scenarioId}</h1>
      <p>Turn-based signed conversation — coming in Stage 5.</p>
    </main>
  );
}
