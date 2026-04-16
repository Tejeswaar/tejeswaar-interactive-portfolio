"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 120;

export default function SnakeGame({ onClose }: { onClose: () => void }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const directionRef = useRef(INITIAL_DIRECTION);

  const generateFood = useCallback(() => {
    let newFood: { x: number; y: number };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on snake
      const onSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    generateFood();
  };

  useEffect(() => {
    generateFood();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent WASD, Arrows, Space, P, Enter from triggering window scroll or terminal typing
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'p', 'w', 'a', 's', 'd', 'enter', 'escape'].includes(key)) {
        if (key !== 'escape' && key !== 'enter') e.preventDefault();
        e.stopPropagation();
      }

      if (!gameStarted && countdown === null && e.key === 'Enter') {
        setCountdown(3);
        e.preventDefault();
        return;
      }

      if (gameOver && e.key === 'Enter') {
        resetGame();
        setCountdown(3);
        e.preventDefault();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        setPaused((p) => !p);
        return;
      }

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (!gameStarted) return;

      const { x, y } = directionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    // Blur any focused element (like the terminal input) to prevent phantom typing
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [gameOver, onClose, gameStarted, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStarted(true);
      setCountdown(null);
    }
  }, [countdown]);

  useEffect(() => {
    if (gameOver || paused || !gameStarted || countdown !== null) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };
        
        // Use the current direction ref to avoid state stale closures
        const currentDir = directionRef.current;
        head.x += currentDir.x;
        head.y += currentDir.y;

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return prevSnake;
        }

        newSnake.unshift(head);

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameInterval);
  }, [food, gameOver, paused, gameStarted, countdown, generateFood]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 overflow-hidden bg-ctp-crust/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="relative bg-ctp-mantle border-2 border-ctp-surface1 rounded-xl p-8 shadow-2xl flex flex-col items-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-ctp-surface1 hover:bg-ctp-red hover:text-ctp-crust transition-colors font-mono font-bold"
      >
        X
      </button>

      <div className="flex flex-col items-center">
        <div className="flex w-full justify-between mb-4 font-mono">
          <h2 className="text-ctp-green font-bold flex gap-2">
            🐍 <span className="hidden sm:inline">TERMINAL SNAKE</span>
          </h2>
          <div className="text-ctp-text">Score: <span className="text-ctp-peach">{score}</span></div>
        </div>

        <div 
          className="relative bg-ctp-base border-2 border-ctp-surface2 rounded"
          style={{ width: GRID_SIZE * 20, height: GRID_SIZE * 20 }}
        >
          {snake.map((segment, index) => (
            <div
              key={index}
              className="absolute bg-ctp-green border border-ctp-base"
              style={{
                width: 20,
                height: 20,
                left: segment.x * 20,
                top: segment.y * 20,
                borderRadius: index === 0 ? '4px' : '0' // Highlight head
              }}
            />
          ))}
          <div
            className="absolute bg-ctp-red rounded-full"
            style={{
              width: 16,
              height: 16,
              left: food.x * 20 + 2,
              top: food.y * 20 + 2,
            }}
          />

          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 bg-ctp-crust/80 flex items-center justify-center text-center p-4">
              <span className="text-ctp-peach text-6xl font-bold font-mono animate-bounce">{countdown}</span>
            </div>
          )}

          {!gameStarted && countdown === null && !gameOver && (
            <div className="absolute inset-0 bg-ctp-crust/80 flex flex-col items-center justify-center text-center p-4 cursor-pointer" onClick={() => setCountdown(3)}>
              <h3 className="text-ctp-green text-xl font-bold font-mono mb-4 animate-pulse">READY?</h3>
              <p className="text-ctp-text font-mono text-sm px-4 py-2 bg-ctp-surface1 hover:bg-ctp-surface2 rounded transition-colors">
                Press Enter to Start
              </p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-ctp-crust/80 flex flex-col items-center justify-center text-center p-4">
              <h3 className="text-ctp-red text-2xl font-bold font-mono mb-2">GAME OVER</h3>
              <p className="text-ctp-text font-mono mb-4 text-sm">Final Score: {score}</p>
              <button 
                onClick={resetGame}
                className="px-4 py-2 bg-ctp-surface1 hover:bg-ctp-surface2 text-ctp-text rounded font-mono text-sm transition-colors"
              >
                Press Enter to Restart
              </button>
            </div>
          )}

          {paused && !gameOver && (
            <div className="absolute inset-0 bg-ctp-crust/50 flex items-center justify-center">
              <h3 className="text-ctp-yellow text-xl font-bold font-mono">PAUSED</h3>
            </div>
          )}
        </div>

        <p className="mt-6 text-ctp-overlay0 text-xs font-mono text-center max-w-sm">
          Use WASD or Arrow Keys to move. P to pause.
        </p>
      </div>
      </div>
    </motion.div>
  );
}
