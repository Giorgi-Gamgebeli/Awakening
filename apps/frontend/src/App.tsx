import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";

function App() {
  const users = useQuery(api.trpc.database.userCount.queryOptions());

  if (users.isPending) return <p>Loading…</p>;
  if (users.isError) return <p>Database request failed.</p>;

  return <p>User count: {users.data.count}</p>;
}

export default App;
