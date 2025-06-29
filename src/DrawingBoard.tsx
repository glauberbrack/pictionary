import React, { useRef, useEffect, useState } from "react";
import "./DrawingBoard.css";

export type DrawingAction = {
  type: "draw" | "clear";
  from?: { x: number; y: number };
  to?: { x: number; y: number };
};

interface DrawingBoardProps {
  canDraw?: boolean;
  onDraw?: (action: DrawingAction) => void;
  drawingData?: DrawingAction[];
}

const DrawingBoard: React.FC<DrawingBoardProps> = ({
  canDraw = true,
  onDraw,
  drawingData = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Responsive + HiDPI canvas
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      let width = parent.clientWidth;
      let height = parent.clientHeight;
      // Desktop: max 600x400, center
      if (window.innerWidth >= 600) {
        width = Math.min(600, width);
        height = Math.min(400, height);
      }
      setCanvasSize({ width, height });
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Drawing helpers
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }
    // Scale for HiDPI
    const dpr = window.devicePixelRatio || 1;
    return { x: x * dpr, y: y * dpr };
  };

  // Draw a single action
  const drawAction = (action: DrawingAction) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (action.type === "clear") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (action.type === "draw" && action.from && action.to) {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(action.from.x, action.from.y);
      ctx.lineTo(action.to.x, action.to.y);
      ctx.stroke();
    }
  };

  // Replay drawingData for guessers
  useEffect(() => {
    if (!canDraw && drawingData.length) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawingData.forEach(drawAction);
    }
  }, [drawingData, canDraw]);

  // Drawing events for drawer
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    setDrawing(true);
    setLastPos(getCanvasPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw || !drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPos) return;
    const pos = getCanvasPos(e);
    const action: DrawingAction = { type: "draw", from: lastPos, to: pos };
    drawAction(action);
    setLastPos(pos);
    if (onDraw) onDraw(action);
  };

  const stopDrawing = () => {
    if (!canDraw) return;
    setDrawing(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onDraw) onDraw({ type: "clear" });
    }
  };

  // Desktop: crosshair cursor
  const isDesktop = window.innerWidth >= 600;
  const cursor = canDraw && isDesktop ? "crosshair" : "default";

  return (
    <div className="drawing-board">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{
          height: "70%",
          width: "90%",
          pointerEvents: canDraw ? "auto" : "none",
          opacity: canDraw ? 1 : 0.7,
          cursor,
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        width={canvasSize.width * (window.devicePixelRatio || 1)}
        height={canvasSize.height * (window.devicePixelRatio || 1)}
      />
      {canDraw && (
        <button className="clear-btn" onClick={clearCanvas}>
          Clear
        </button>
      )}
    </div>
  );
};

export default DrawingBoard;
