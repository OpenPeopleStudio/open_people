"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { GraphData } from "@/app/api/notes/graph/route";

/* ═══════════════════════════════════════════════════════════════════════════
   Neural Web / Knowledge Graph Visualization
   Watch your knowledge grow like neurons connecting
   ═══════════════════════════════════════════════════════════════════════════ */

interface SimulationNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  category_name: string | null;
  project_name: string | null;
  connection_count: number;
  content_length: number;
}

interface SimulationEdge {
  source: string;
  target: string;
  link_type: string;
}

export default function NeuralGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation state
  const nodesRef = useRef<SimulationNode[]>([]);
  const edgesRef = useRef<SimulationEdge[]>([]);
  
  // Interaction state
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimulationNode | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  // Settings
  const [showLabels, setShowLabels] = useState(true);
  const [colorBy, setColorBy] = useState<"category" | "project" | "age">("category");
  const [sizeBy, setSizeBy] = useState<"connections" | "content" | "uniform">("connections");
  
  // Fetch graph data
  useEffect(() => {
    async function loadGraph() {
      try {
        setLoading(true);
        const res = await fetch("/api/notes/graph");
        if (!res.ok) throw new Error("Failed to load graph");
        const data: GraphData = await res.json();
        setGraphData(data);
        initializeSimulation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load graph");
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, []);
  
  // Initialize simulation nodes and edges
  const initializeSimulation = useCallback((data: GraphData) => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create color map for categories
    const categoryColors: Record<string, string> = {};
    data.stats.categories.forEach((cat) => {
      categoryColors[cat.id] = cat.color;
    });
    
    // Create color map for projects
    const projectColors: Record<string, string> = {};
    const projectPalette = [
      "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", 
      "#ef4444", "#ec4899", "#3b82f6", "#84cc16"
    ];
    data.stats.projects.forEach((proj, i) => {
      projectColors[proj.name] = projectPalette[i % projectPalette.length];
    });
    
    // Initialize nodes in a circular layout
    const angleStep = (2 * Math.PI) / Math.max(data.nodes.length, 1);
    const radius = Math.min(width, height) * 0.35;
    
    nodesRef.current = data.nodes.map((node, i) => {
      const angle = i * angleStep;
      
      // Determine color
      let color = "#6b7280";
      if (colorBy === "category" && node.category_id) {
        color = categoryColors[node.category_id] || color;
      } else if (colorBy === "project" && node.project_name) {
        color = projectColors[node.project_name] || color;
      } else if (colorBy === "age") {
        const age = Date.now() - new Date(node.created_at).getTime();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        const t = Math.min(age / maxAge, 1);
        // Interpolate from bright to dim
        const brightness = Math.floor(255 - t * 155);
        color = `rgb(${brightness}, ${Math.floor(brightness * 0.9)}, ${brightness})`;
      }
      
      // Determine size
      let nodeRadius = 8;
      if (sizeBy === "connections") {
        nodeRadius = 6 + Math.min(node.connection_count * 3, 20);
      } else if (sizeBy === "content") {
        nodeRadius = 6 + Math.min(node.content_length / 500, 20);
      }
      
      return {
        id: node.id,
        title: node.title,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        radius: nodeRadius,
        color,
        category_name: node.category_name,
        project_name: node.project_name,
        connection_count: node.connection_count,
        content_length: node.content_length,
      };
    });
    
    edgesRef.current = data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      link_type: edge.link_type,
    }));
  }, [colorBy, sizeBy]);
  
  // Re-initialize when settings change
  useEffect(() => {
    if (graphData) {
      initializeSimulation(graphData);
    }
  }, [graphData, colorBy, sizeBy, initializeSimulation]);
  
  // Physics simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    
    if (nodes.length === 0) return;
    
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Build adjacency for faster lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Apply forces
    for (const node of nodes) {
      // Skip dragged node
      if (dragNodeRef.current?.id === node.id) continue;
      
      // Center gravity (weak)
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * 0.0001;
      node.vy += dy * 0.0001;
      
      // Repulsion from other nodes
      for (const other of nodes) {
        if (node.id === other.id) continue;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = node.radius + other.radius + 30;
        
        if (dist < minDist * 3) {
          const force = (minDist * 3 - dist) / dist * 0.03;
          node.vx += dx * force;
          node.vy += dy * force;
        }
      }
    }
    
    // Spring forces from edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;
      
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 100 + source.radius + target.radius;
      const force = (dist - targetDist) / dist * 0.02;
      
      if (dragNodeRef.current?.id !== source.id) {
        source.vx += dx * force;
        source.vy += dy * force;
      }
      if (dragNodeRef.current?.id !== target.id) {
        target.vx -= dx * force;
        target.vy -= dy * force;
      }
    }
    
    // Update positions with damping
    for (const node of nodes) {
      if (dragNodeRef.current?.id === node.id) continue;
      
      node.vx *= 0.9;
      node.vy *= 0.9;
      node.x += node.vx;
      node.y += node.vy;
      
      // Boundary constraints
      const margin = 50;
      node.x = Math.max(margin, Math.min(width - margin, node.x));
      node.y = Math.max(margin, Math.min(height - margin, node.y));
    }
  }, []);
  
  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    
    // Clear
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, width, height);
    
    // Apply transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Build node map
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Draw edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;
      
      // Check if connected to selected or hovered
      const isHighlighted = 
        selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id) ||
        hoveredNode && (source.id === hoveredNode.id || target.id === hoveredNode.id);
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      
      if (isHighlighted) {
        ctx.strokeStyle = "rgba(200, 255, 0, 0.6)";
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = "rgba(100, 100, 120, 0.25)";
        ctx.lineWidth = 1;
      }
      ctx.stroke();
      
      // Draw edge glow for highlighted
      if (isHighlighted) {
        ctx.strokeStyle = "rgba(200, 255, 0, 0.15)";
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    }
    
    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isConnected = 
        selectedNode && edges.some(e => 
          (e.source === selectedNode.id && e.target === node.id) ||
          (e.target === selectedNode.id && e.source === node.id)
        );
      
      // Glow effect
      if (isSelected || isHovered || isConnected) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, node.radius,
          node.x, node.y, node.radius * 3
        );
        gradient.addColorStop(0, `${node.color}40`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      // Fill
      const alpha = (isSelected || isHovered || isConnected) ? 1 : 0.85;
      ctx.fillStyle = isSelected || isHovered 
        ? "#c8ff00" 
        : isConnected 
          ? node.color
          : `${node.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
      
      // Border
      if (isSelected) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isHovered) {
        ctx.strokeStyle = "#c8ff00";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Label
      if (showLabels && (zoom > 0.6 || isSelected || isHovered || isConnected)) {
        ctx.font = `${11 / zoom}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        const labelY = node.y + node.radius + 4;
        const text = node.title.length > 25 ? node.title.slice(0, 22) + "..." : node.title;
        
        // Text shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillText(text, node.x + 1, labelY + 1);
        
        // Text
        ctx.fillStyle = isSelected || isHovered ? "#c8ff00" : "#e0e0e0";
        ctx.fillText(text, node.x, labelY);
      }
    }
    
    ctx.restore();
  }, [pan, zoom, selectedNode, hoveredNode, showLabels]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Set canvas size
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    
    // Animation
    let running = true;
    const loop = () => {
      if (!running) return;
      simulate();
      render();
      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resize);
    };
  }, [simulate, render]);
  
  // Mouse handlers
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): SimulationNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 5) {
        return node;
      }
    }
    return null;
  }, [pan, zoom]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      dragNodeRef.current = node;
      setSelectedNode(node);
    } else {
      isDraggingRef.current = true;
      setSelectedNode(null);
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [getNodeAtPosition]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (dragNodeRef.current) {
      const rect = canvas.getBoundingClientRect();
      dragNodeRef.current.x = (e.clientX - rect.left - pan.x) / zoom;
      dragNodeRef.current.y = (e.clientY - rect.top - pan.y) / zoom;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setHoveredNode(node);
      canvas.style.cursor = node ? "pointer" : "grab";
    }
  }, [getNodeAtPosition, pan, zoom]);
  
  const handleMouseUp = useCallback(() => {
    dragNodeRef.current = null;
    isDraggingRef.current = false;
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.2, Math.min(3, prev * delta)));
  }, []);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      window.location.href = `/super-admin/notes/${node.id}`;
    }
  }, [getNodeAtPosition]);
  
  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--surface-2)]" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-[var(--electric-lime)] animate-spin" />
          </div>
          <p className="text-[var(--text-muted)]">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-[var(--error)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Canvas */}
      <div ref={containerRef} className="flex-1 relative bg-[#0a0a0f]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
        
        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Link
            href="/super-admin/notes"
            className="px-3 py-2 rounded-lg bg-[var(--surface-1)]/90 backdrop-blur border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Notes
          </Link>
        </div>
        
        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            className="w-10 h-10 rounded-lg bg-[var(--surface-1)]/90 backdrop-blur border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.2, prev / 1.2))}
            className="w-10 h-10 rounded-lg bg-[var(--surface-1)]/90 backdrop-blur border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetView}
            className="w-10 h-10 rounded-lg bg-[var(--surface-1)]/90 backdrop-blur border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
            title="Reset View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          </button>
        </div>
        
        {/* Stats Overlay */}
        <div className="absolute top-4 right-4 w-64">
          <div className="p-4 rounded-xl bg-[var(--surface-1)]/90 backdrop-blur border border-[var(--border-subtle)]">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Knowledge Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Notes</span>
                <span className="text-[var(--text-primary)] font-medium">{graphData?.stats.total_notes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Connections</span>
                <span className="text-[var(--electric-lime)] font-medium">{graphData?.stats.total_connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Orphan Notes</span>
                <span className="text-[var(--warning)] font-medium">{graphData?.stats.orphan_notes}</span>
              </div>
              {graphData?.stats.most_connected && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] text-xs">Most Connected</span>
                  <p className="text-[var(--text-primary)] truncate">{graphData.stats.most_connected.title}</p>
                  <p className="text-xs text-[var(--electric-lime)]">{graphData.stats.most_connected.count} connections</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Selected Node Info */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 w-72">
            <div className="p-4 rounded-xl bg-[var(--surface-1)]/90 backdrop-blur border border-[var(--electric-lime)]/30">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                  {selectedNode.title}
                </h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-1 text-xs text-[var(--text-muted)] mb-3">
                {selectedNode.category_name && (
                  <p>Category: {selectedNode.category_name}</p>
                )}
                {selectedNode.project_name && (
                  <p>Project: {selectedNode.project_name}</p>
                )}
                <p>Connections: {selectedNode.connection_count}</p>
              </div>
              
              <Link
                href={`/super-admin/notes/${selectedNode.id}`}
                className="block w-full py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium text-center hover:brightness-110 transition-all"
              >
                Open Note
              </Link>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <p className="px-4 py-2 rounded-full bg-[var(--surface-1)]/70 backdrop-blur text-xs text-[var(--text-muted)]">
            Drag to pan • Scroll to zoom • Click node to select • Double-click to open
          </p>
        </div>
      </div>
      
      {/* Settings Sidebar */}
      <div className="w-64 border-l border-[var(--border-subtle)] p-4 bg-[var(--surface-1)] overflow-y-auto">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">Display Settings</h2>
        
        {/* Show Labels */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Show Labels</span>
          </label>
        </div>
        
        {/* Color By */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Color By
          </h3>
          <div className="space-y-1">
            {(["category", "project", "age"] as const).map(option => (
              <button
                key={option}
                onClick={() => setColorBy(option)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  colorBy === option
                    ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Size By */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Size By
          </h3>
          <div className="space-y-1">
            {(["connections", "content", "uniform"] as const).map(option => (
              <button
                key={option}
                onClick={() => setSizeBy(option)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  sizeBy === option
                    ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        {colorBy === "category" && graphData?.stats.categories && graphData.stats.categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Categories
            </h3>
            <div className="space-y-1">
              {graphData.stats.categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[var(--text-muted)] ml-auto">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {colorBy === "project" && graphData?.stats.projects && graphData.stats.projects.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Projects
            </h3>
            <div className="space-y-1">
              {graphData.stats.projects.map((proj, i) => {
                const colors = ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#3b82f6", "#84cc16"];
                return (
                  <div key={proj.name} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="truncate">{proj.name}</span>
                    <span className="text-[var(--text-muted)] ml-auto">{proj.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Quick Tips */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Tips
          </h3>
          <ul className="space-y-2 text-xs text-[var(--text-muted)]">
            <li>• Larger nodes = more connections/content</li>
            <li>• Drag nodes to rearrange</li>
            <li>• Orphan notes have no connections</li>
            <li>• Link notes using [[note-slug]] in content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
