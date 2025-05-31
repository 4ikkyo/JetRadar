import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { WebApp } from "@twa-dev/sdk";
import Graph from "@/components/Graph";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const tgUser = WebApp.initDataUnsafe.user;
      const userId = tgUser?.id;
      const res = await fetch(`https://your-backend.com/graph?telegram_id=${userId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Graph fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    fetchGraph();
  }, []);

  return (
    <main className="p-4 min-h-screen bg-gray-100">
      <h1 className="text-xl font-bold mb-4 text-center">JetRadar Graph</h1>
      {loading ? (
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : data ? (
        <Graph data={data} />
      ) : (
        <p className="text-center text-sm text-gray-600">Немає даних для відображення</p>
      )}

      <div className="mt-4 flex justify-center">
        <Button onClick={fetchGraph}>🔄 Оновити</Button>
      </div>
    </main>
  );
}