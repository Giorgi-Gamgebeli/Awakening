import { useNavigate } from "react-router";
import Session from "supertokens-auth-react/recipe/session";
import { Button } from "../components/Button";

export default function HomePage() {
  const navigate = useNavigate();

  async function signOut() {
    await Session.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <main>
      <p>welcome home</p>
      <Button onClick={signOut}>Log out</Button>
    </main>
  );
}
