import { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";

export default function Graph({ data }: { data: any }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes || !data.edges || !containerRef.current) return;

    const network = new Network(containerRef.current, data, {
      nodes: {
        shape: "dot",
        size: 10,
        font: { size: 14 },
      },
      edges: {
        arrows: "to",
        smooth: true,
      },
      physics: {
        enabled: true,
      },
    });

    return () => network?.destroy();
  }, [data]);

  return <div ref={containerRef} className="w-full h-[500px] bg-white rounded shadow" />;
}
