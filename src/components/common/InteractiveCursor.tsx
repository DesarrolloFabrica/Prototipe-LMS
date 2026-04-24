import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";

export function InteractiveCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Posición del mouse con suavizado (Spring)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);

    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      // Actualizar variables CSS globales para efectos de fondo
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isSelectable = 
        target.closest("button") || 
        target.closest("a") || 
        target.closest("[role='button']") ||
        target.closest(".interactive-hover");
      
      setIsHovering(!!isSelectable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", moveMouse);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveMouse);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* 1. Destello de Fondo (Spotlight sutil) */}
      <motion.div
        className="absolute h-[200px] w-[200px] rounded-full bg-blue-500/5 blur-[120px]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* 2. Cursor Exterior (Aro Tecnológico) */}
      <motion.div
        className="absolute h-10 w-10 rounded-full border border-blue-500/30"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          scale: isHovering ? 2 : 1,
          opacity: isClicking ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3. Núcleo de Energía (El Punto central) */}
      <motion.div
        className="absolute h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          scale: isClicking ? 0.5 : 1,
        }}
      />

      {/* 4. Partículas en Click (Efecto de Explosión) */}
      {isClicking && (
        <div className="absolute" style={{ left: mouseX.get(), top: mouseY.get() }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ 
                x: (Math.random() - 0.5) * 100, 
                y: (Math.random() - 0.5) * 100, 
                opacity: 0,
                scale: 0
              }}
              className="absolute h-1 w-1 rounded-full bg-blue-400"
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
