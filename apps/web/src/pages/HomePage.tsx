import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { authClient } from "../lib/authClient";

export default function HomePage() {
  const navigate = useNavigate();

  async function signOut() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <main>
      <p>welcome home</p>
      <Button onClick={signOut}>Log out</Button>
    </main>
  );
}
