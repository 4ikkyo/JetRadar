import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// --- ADVANCED GRAPH SECTION ---
const D3Graph = ({ graphData, onNodeClick, setTooltipContent, setTooltipPosition, setShowTooltip }) => {
    const ref = useRef();
    const [activeNode, setActiveNode] = useState(null);

    const containerRef = useRef(null); // Ref to the parent container for relative positioning

    useEffect(() => {
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            d3.select(ref.current).selectAll("*").remove();
            return;
        }

        const svgElement = d3.select(ref.current);
        svgElement.selectAll("*").remove(); // Clear previous SVG contents

        const width = ref.current.clientWidth;
        const height = ref.current.clientHeight;

        const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1));

        const svg = svgElement.attr("viewBox", [0, 0, width, height]);
        const g = svg.append("g"); // Group for zoom/pan

        // Define arrow markers
        svg.append("defs").selectAll("marker")
        .data(["arrow"])
        .enter().append("marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15) // Position of the arrow tip relative to the end of the line
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");

        const link = g.append("g")
        .attr("stroke-opacity", 0.6)
        .attr("stroke", "#999")
        .attr("stroke-width", 1.5)
        .selectAll("line")
        .data(graphData.links)
        .join("line")
        .attr("class", "graph-link")
        .attr("marker-end", "url(#arrow)"); // Apply arrow marker

        const node = g.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("g")
        .data(graphData.nodes)
        .join("g")
        .attr("class", "graph-node");

        node.append("circle")
        .attr("r", 8)
        .attr("fill", d => d.tokenType === 'TON' ? '#4F46E5' : '#F59E0B');

        node.append("text")
        .text(d => d.name)
        .attr('x', 0)
        .attr('y', 15)
        .attr("class", "node-text")
        .attr("stroke", "none")
        .attr("fill", "#F00FFF");

        // Zoom and Pan behavior
        const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            if (setShowTooltip) setShowTooltip(false); // Check if setShowTooltip is a function before calling
        });
            svg.call(zoom);

            // Drag behavior
            const dragBehavior = d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
                if (setShowTooltip) setShowTooltip(false); // Check if setShowTooltip is a function before calling
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

            node.call(dragBehavior);

            // Highlighting on Node Click
            const isConnected = (a, b) => {
                return graphData.links.some(l => (l.source.id === a && l.target.id === b) || (l.source.id === b && l.target.id === a));
            };

            node.on("click", function(event, d) {
                event.stopPropagation(); // Prevent click on SVG background
                if (setShowTooltip) setShowTooltip(false);

                if (activeNode === d.id) {
                    setActiveNode(null); // Deselect
                } else {
                    setActiveNode(d.id); // Select
                    onNodeClick(d); // Propagate node click event to parent
                }
            });

            // Click on SVG background to reset highlighting
            svg.on("click", () => setActiveNode(null));


            // Tooltip on Long Press (Touch Devices) and Mouse Hover
            let pressTimer;
            const LONG_PRESS_DURATION = 500; // milliseconds

            const showNodeTooltip = (event, d) => {
                if (setTooltipContent) setTooltipContent(d);
                if (setTooltipPosition) {
                    setTooltipPosition({
                        left: `${event.clientX}px`,
                        top: `${event.clientY + 20}px`
                    });
                }
                if (setShowTooltip) setShowTooltip(true);
            };

                node.on("touchstart", function(event, d) {
                    event.stopPropagation(); // Prevent swipe navigation
                    pressTimer = setTimeout(() => showNodeTooltip(event, d), LONG_PRESS_DURATION);
                })
                .on("touchend", function() {
                    clearTimeout(pressTimer);
                })
                .on("touchmove", function() {
                    clearTimeout(pressTimer); // Cancel long press if finger moves
                    if (setShowTooltip) setShowTooltip(false);
                });

                    node.on("mouseover", function(event, d) {
                        if (window.innerWidth >= 768) { // Only for larger screens (non-touch)
                            showNodeTooltip(event, d);
                        }
                    })
                    .on("mouseout", function() {
                        if (window.innerWidth >= 768) {
                            if (setShowTooltip) setShowTooltip(false);
                        }
                    });
                    
                    simulation.on("tick", () => {
                        link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);

                        node.attr("transform", d => `translate(${d.x}, ${d.y})`);

                        // Apply highlighting/dimming based on activeNode
                        node.classed("highlighted-node", d => d.id === activeNode);
                        link.classed("highlighted-link", l => l.source.id === activeNode || l.target.id === activeNode);

                        if (activeNode) {
                            node.classed("dimmed", d => d.id !== activeNode && !isConnected(d.id, activeNode));
                            link.classed("dimmed", l => l.source.id !== activeNode && l.target.id !== activeNode);
                        } else {
                            node.classed("dimmed", false);
                            link.classed("dimmed", false);
                        }
                    });

                    return () => {
                        // Cleanup D3 elements and event listeners on unmount
                        svgElement.selectAll("*").remove();
                        svg.on(".zoom", null);
                        node.on(".drag", null);
                        node.on("click", null).on("mouseover", null).on("mouseout", null);
                        node.on("touchstart", null).on("touchend", null).on("touchmove", null);
                        if (setShowTooltip) setShowTooltip(false); // Ensure tooltip is hidden on unmount
                    };

    }, [graphData, activeNode, setShowTooltip, setTooltipContent, setTooltipPosition]);


    return (
        <div ref={containerRef} className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 relative overflow-hidden">
        <svg ref={ref} className="w-full h-full"></svg>
        </div>
    );
};

export default D3Graph;
