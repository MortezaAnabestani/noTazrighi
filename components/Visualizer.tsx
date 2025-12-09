
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PoetryResponse, NodeData, LinkData } from '../types';

interface VisualizerProps {
  data: PoetryResponse;
}

type ViewType = 'GRAPH' | 'IMAGE' | 'CITY';

const Visualizer: React.FC<VisualizerProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewType, setViewType] = useState<ViewType>('GALAXY' as any);
  const simulationRef = useRef<d3.Simulation<NodeData, undefined> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverInfo, setHoverInfo] = useState<{word: string, line: number, index: number, x: number, y: number} | null>(null);

  // Initialize view type
  useEffect(() => {
      setViewType('GRAPH');
  }, []);

  // Handle Resizing
  useEffect(() => {
    if (!wrapperRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
    });
    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --------------------------------------------------------------------------
  // GALAXY GRAPH VIEW (D3)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (viewType !== 'GRAPH' || dimensions.width === 0) return;
    if (!svgRef.current || !data.keywords.length) return;

    const { width, height } = dimensions;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Data Preparation
    const nodes: NodeData[] = [{ id: data.title, group: 1 }];
    data.keywords.forEach((word) => nodes.push({ id: word, group: 2 }));
    
    // Create links for galaxy structure
    const links: LinkData[] = [];
    data.keywords.forEach((word) => {
      links.push({ source: data.title, target: word, value: 1 });
    });

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Define Neon Filters
    const defs = svg.append("defs");
    const glow = defs.append("filter").attr("id", "galaxy-glow");
    glow.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Main Container Group for rotation
    const container = svg.append("g")
        .attr("transform-origin", `${width/2} ${height/2}`);

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
        });
    svg.call(zoom);

    // Render Links
    const link = container.append("g")
      .attr("stroke", "#00ffff") // Cyan neon
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Hexagon Shape
    const hexagon = (size: number) => {
        const angles = [0, 60, 120, 180, 240, 300].map(a => a * (Math.PI / 180));
        return `M${size * Math.cos(angles[0])},${size * Math.sin(angles[0])} ` +
               angles.slice(1).map(a => `L${size * Math.cos(a)},${size * Math.sin(a)}`).join(" ") + "Z";
    };

    // Render Nodes
    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("path")
      .attr("d", d => hexagon(d.group === 1 ? 50 : 25))
      .attr("fill", "#050505")
      .attr("stroke", d => d.group === 1 ? "#fff" : "#00ffff")
      .attr("stroke-width", d => d.group === 1 ? 3 : 2)
      .attr("filter", "url(#galaxy-glow)");

    node.append("text")
      .attr("dy", d => d.group === 1 ? 75 : 45)
      .attr("text-anchor", "middle")
      .text(d => d.id)
      .attr("fill", "#fff")
      .attr("font-size", d => d.group === 1 ? "18px" : "14px")
      .attr("font-weight", "bold")
      .style("text-shadow", "0 0 5px #00ffff");

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-400))
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const padding = 60; // Margin from edge

    simulation.on("tick", () => {
        // HARD CLAMPING to keep nodes inside the view
        nodes.forEach(d => {
             d.x = Math.max(padding, Math.min(width - padding, d.x || width/2));
             d.y = Math.max(padding, Math.min(height - padding, d.y || height/2));
        });

        link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    // Subtle Auto-Rotation
    let rotateTimer = d3.timer((elapsed) => {
        // container.attr("transform", `rotate(${elapsed * 0.01}, ${width/2}, ${height/2})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = Math.max(padding, Math.min(width - padding, event.x));
      d.fy = Math.max(padding, Math.min(height - padding, event.y));
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => { 
        simulation.stop(); 
        rotateTimer.stop();
    };
  }, [data, viewType, dimensions]);


  // --------------------------------------------------------------------------
  // CITY OF DATA VIEW (ISOMETRIC CANVAS) - LINE & WORD BASED
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (viewType !== 'CITY' || !canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Process Poem into Structure: Lines -> Words
    // Filter empty lines
    const rawLines = data.content.split('\n').filter(l => l.trim().length > 0);
    const gridData = rawLines.map(line => line.trim().split(/\s+/)); // Array of Array of Words

    const rowCount = gridData.length;
    let maxWordsInRow = 0;
    gridData.forEach(row => { if (row.length > maxWordsInRow) maxWordsInRow = row.length });

    // 2. Auto-Fit / Scaling
    // We need to fit a rhombic shape into the canvas.
    // Width ~ (Rows + Cols) * TileW
    const PADDING = 80;
    const availW = dimensions.width - PADDING * 2;
    // Calculate TileW based on the diagonal width needed
    const neededDiagonals = rowCount + maxWordsInRow;
    const tileW = Math.min(60, Math.floor(availW / (neededDiagonals * 0.8))); // 0.8 factor for spacing
    const tileH = tileW / 2;

    const originX = dimensions.width / 2;
    // Start higher up if we have many rows
    const originY = dimensions.height / 2 - (rowCount * tileH) / 2; 

    let frameId: number;
    let tick = 0;

    const render = () => {
        tick++;
        // Bg
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        // Draw "Streets" (Lines) and "Buildings" (Words)
        // Iterate rows (Lines of poem)
        for (let r = 0; r < rowCount; r++) {
            const words = gridData[r];
            
            // Draw Street (Base for the line)
            // Street extends from col 0 to col words.length
            // but we can draw individual tiles for consistent look
            
            for (let c = 0; c < words.length; c++) {
                const word = words[c];
                const wordLen = word.length;
                
                // Iso Coords
                // To separate lines visually, we add a gap factor to 'r'
                const rowGap = r * 1.5; 
                
                const isoX = originX + (c - rowGap) * tileW;
                const isoY = originY + (c + rowGap) * tileH;

                // --- Building Logic ---
                // Height based on word length
                const baseHeight = Math.max(10, wordLen * 8);
                const breathe = Math.sin((tick * 0.05) + c + r) * 2;
                const totalHeight = baseHeight + breathe;

                // Color Logic
                // Longer words = brighter/warmer
                const hue = 180 + (wordLen * 10); // Cyan to Purple
                const isHovered = hoverInfo && hoverInfo.line === r && hoverInfo.index === c;
                
                const colorTop = isHovered ? '#fff' : `hsl(${hue}, 80%, 50%)`;
                const colorSideRight = `hsl(${hue}, 60%, 30%)`;
                const colorSideLeft = `hsl(${hue}, 60%, 20%)`;

                // Draw Building (Pillar)
                
                // Right Face
                ctx.fillStyle = colorSideRight;
                ctx.beginPath();
                ctx.moveTo(isoX + tileW, isoY);
                ctx.lineTo(isoX + tileW, isoY - totalHeight);
                ctx.lineTo(isoX, isoY + tileH - totalHeight);
                ctx.lineTo(isoX, isoY + tileH);
                ctx.closePath();
                ctx.fill();

                // Left Face
                ctx.fillStyle = colorSideLeft;
                ctx.beginPath();
                ctx.moveTo(isoX - tileW, isoY);
                ctx.lineTo(isoX - tileW, isoY - totalHeight);
                ctx.lineTo(isoX, isoY + tileH - totalHeight);
                ctx.lineTo(isoX, isoY + tileH);
                ctx.closePath();
                ctx.fill();

                // Top Face
                ctx.fillStyle = colorTop;
                ctx.beginPath();
                ctx.moveTo(isoX, isoY - tileH - totalHeight);
                ctx.lineTo(isoX + tileW, isoY - totalHeight);
                ctx.lineTo(isoX, isoY + tileH - totalHeight);
                ctx.lineTo(isoX - tileW, isoY - totalHeight);
                ctx.closePath();
                ctx.fill();

                // Base / Road segment highlight
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        // Overlay info text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(`LINES: ${rowCount}`, 10, dimensions.height - 20);
        ctx.fillText(`WORDS: ${gridData.flat().length}`, 10, dimensions.height - 10);

        frameId = requestAnimationFrame(render);
    };

    // Interaction
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Simple Hit Test: Iterate and check distance to "Top Face Center"
        let found = null;
        let minDist = 1000;

        for (let r = 0; r < rowCount; r++) {
            const rowGap = r * 1.5; 
            for (let c = 0; c < gridData[r].length; c++) {
                 const isoX = originX + (c - rowGap) * tileW;
                 const isoY = originY + (c + rowGap) * tileH;
                 
                 // Approximate top center Y: isoY - (height ~ 20)
                 // This is rough because height varies. 
                 // Better to check distance to ground point (isoX, isoY)
                 const dist = Math.sqrt((mx - isoX)**2 + (my - isoY)**2);
                 
                 // If close enough to base
                 if (dist < tileW && dist < minDist) {
                     minDist = dist;
                     found = {
                         word: gridData[r][c],
                         line: r + 1,
                         index: c + 1,
                         x: isoX + rect.left,
                         y: isoY + rect.top - 40 // offset tooltip up
                     };
                 }
            }
        }
        
        setHoverInfo(found);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => setHoverInfo(null));

    render();
    return () => {
        cancelAnimationFrame(frameId);
        canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewType, data, dimensions]);


  return (
    <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-black border border-cyan-500/20 rounded-xl shadow-2xl flex flex-col group">
      
      {/* View Toggle */}
      <div className="absolute top-4 right-4 z-30 flex gap-2 bg-black/80 p-1 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
          <button 
             onClick={() => setViewType('GRAPH')}
             className={`px-4 py-2 rounded text-xs font-bold transition-all ${viewType === 'GRAPH' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'text-gray-400 hover:text-white'}`}
          >
              کهکشان معنا
          </button>
          <button 
             onClick={() => setViewType('CITY')}
             className={`px-4 py-2 rounded text-xs font-bold transition-all ${viewType === 'CITY' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.6)]' : 'text-gray-400 hover:text-white'}`}
          >
              شهر داده (Data City)
          </button>
          <button 
             onClick={() => setViewType('IMAGE')}
             disabled={!data.imageBase64}
             className={`px-4 py-2 rounded text-xs font-bold transition-all ${viewType === 'IMAGE' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.6)]' : 'text-gray-400 hover:text-white disabled:opacity-30'}`}
          >
              تصویر خیالی
          </button>
      </div>

      {viewType === 'GRAPH' && (
          <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing touch-none" />
      )}

      {viewType === 'CITY' && (
          <div className="w-full h-full relative cursor-crosshair">
              <canvas ref={canvasRef} className="w-full h-full block" />
              
              {/* Tooltip Overlay */}
              {hoverInfo && (
                  <div 
                    className="fixed z-50 pointer-events-none bg-black/90 border border-indigo-500/50 p-3 rounded-lg text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] backdrop-blur-sm"
                    style={{ left: hoverInfo.x, top: hoverInfo.y, transform: 'translate(-50%, -100%)' }}
                  >
                      <div className="text-white font-black text-sm mb-1 text-center">{`"${hoverInfo.word}"`}</div>
                      <div className="text-gray-400 flex flex-col gap-0.5 font-mono text-[10px] text-center">
                          <span>سطر: {hoverInfo.line}</span>
                          <span>کلمه: {hoverInfo.index}</span>
                      </div>
                  </div>
              )}

              <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 pointer-events-none">
                   <div className="text-[10px] font-mono text-indigo-400/70 bg-black/60 px-2 py-1 rounded border border-indigo-900/50">
                      ARCH: LINE_BASED_ISOMETRIC
                   </div>
              </div>
          </div>
      )}

      {viewType === 'IMAGE' && data.imageBase64 && (
          <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black animate-in fade-in duration-500">
                  <img 
                    src={`data:image/jpeg;base64,${data.imageBase64}`} 
                    alt="Abstract Generated Art" 
                    className="max-h-full max-w-full rounded-lg shadow-[0_0_100px_rgba(192,38,211,0.3)] border border-fuchsia-500/20 object-contain"
                  />
          </div>
      )}
    </div>
  );
};

export default Visualizer;
