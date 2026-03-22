import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Gamepad2, Trophy, Terminal, Cpu, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

interface Point {
  x: number;
  y: number;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "ERR_NULL_POINTER",
    artist: "KERNEL_PANIC",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/glitch1/400/400?grayscale",
  },
  {
    id: 2,
    title: "STACK_OVERFLOW",
    artist: "VOID_MAIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/glitch2/400/400?grayscale",
  },
  {
    id: 3,
    title: "SEGMENTATION_FAULT",
    artist: "ROOT_ACCESS",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch3/400/400?grayscale",
  },
];

// --- Components ---

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const animate = useCallback((time: number) => {
    if (time - lastUpdateTimeRef.current > GAME_SPEED) {
      moveSnake();
      lastUpdateTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(animate);
  }, [moveSnake]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(animate);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw scanlines on canvas
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.height; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#0ff' : '#f0f';
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);
      
      // Glitch effect on head
      if (index === 0 && Math.random() > 0.9) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(segment.x * cellSize - 2, segment.y * cellSize, cellSize + 4, cellSize);
      }
    });

    // Draw food
    ctx.fillStyle = Math.random() > 0.1 ? '#ff0' : '#fff';
    ctx.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);

  }, [snake, food]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-black border-2 border-glitch-cyan relative">
      <div className="absolute -top-3 left-4 bg-black px-2 text-glitch-cyan font-pixel text-[10px] uppercase tracking-tighter">
        SUB_PROCESS_01
      </div>
      
      <div className="flex justify-between w-full items-center mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="text-glitch-cyan w-4 h-4" />
          <h2 className="font-pixel text-xs text-glitch-cyan glitch-text" data-text="CORE_LOGIC">CORE_LOGIC</h2>
        </div>
        <div className="font-pixel text-glitch-magenta text-xs">
          DATA: {score.toString().padStart(6, '0')}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-glitch-magenta/50"
        />
        
        <AnimatePresence>
          {(gameOver || isPaused) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/90"
            >
              {gameOver ? (
                <>
                  <AlertTriangle className="text-glitch-magenta w-12 h-12 mb-4 animate-pulse" />
                  <h3 className="text-2xl font-pixel text-glitch-magenta glitch-text mb-2" data-text="SYSTEM_CRASH">SYSTEM_CRASH</h3>
                  <p className="text-glitch-cyan mb-8 font-mono text-sm">MEMORY_LEAK_DETECTED: {score}</p>
                  <button
                    onClick={resetGame}
                    className="px-6 py-2 border-2 border-glitch-magenta text-glitch-magenta font-pixel text-xs hover:bg-glitch-magenta hover:text-black transition-all active:translate-y-1"
                  >
                    RE_INITIALIZE
                  </button>
                </>
              ) : (
                <>
                  <Cpu className="text-glitch-cyan w-12 h-12 mb-4 animate-bounce" />
                  <h3 className="text-2xl font-pixel text-glitch-cyan glitch-text mb-8" data-text="HALT_STATE">HALT_STATE</h3>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-6 py-2 border-2 border-glitch-cyan text-glitch-cyan font-pixel text-xs hover:bg-glitch-cyan hover:text-black transition-all active:translate-y-1"
                  >
                    EXECUTE
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-glitch-cyan/40 text-[8px] font-pixel uppercase">
        <span>[DIR] ARROWS</span>
        <span>[HALT] SPACE</span>
        <span>[VER] 0.9.4-B</span>
        <span>[ST] NOMINAL</span>
      </div>
    </div>
  );
};

const MusicPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  return (
    <div className="w-full max-w-xs bg-black border-2 border-glitch-magenta p-4 flex flex-col gap-4 relative">
      <div className="absolute -top-3 right-4 bg-black px-2 text-glitch-magenta font-pixel text-[10px] uppercase tracking-tighter">
        AUDIO_STREAM_02
      </div>
      
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />

      <div className="flex gap-4">
        <div className="w-20 h-20 border border-glitch-magenta overflow-hidden shrink-0 relative">
          <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover opacity-70 grayscale" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-glitch-magenta/10 mix-blend-overlay" />
          {isPlaying && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="w-full h-1 bg-white/30 absolute top-0 animate-[glitch-anim_0.5s_infinite]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Music className="w-3 h-3 text-glitch-magenta" />
            <span className="text-[8px] font-pixel text-glitch-magenta uppercase">STREAMING...</span>
          </div>
          <h3 className="text-xs font-pixel text-white truncate glitch-text" data-text={currentTrack.title}>{currentTrack.title}</h3>
          <p className="text-[10px] text-glitch-cyan font-mono mt-1">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-2 w-full bg-glitch-magenta/10 border border-glitch-magenta/30 relative overflow-hidden">
          <motion.div
            className="h-full bg-glitch-magenta"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.1 }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-glitch-cyan/50">
          <span>{audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "00:00"}</span>
          <span>{audioRef.current && !isNaN(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "00:00"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button onClick={handlePrev} className="text-glitch-cyan hover:text-white transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-glitch-magenta hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={handleNext} className="text-glitch-cyan hover:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-0.5 items-end h-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              animate={{ height: isPlaying ? [2, Math.random() * 16 + 2, 2] : 2 }}
              transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
              className="w-1 bg-glitch-cyan"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 gap-8 relative overflow-hidden font-mono">
      {/* Visual Artifacts */}
      <div className="noise-overlay" />
      <div className="crt-lines" />
      
      <div className="z-10 flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-5xl">
        <div className="flex flex-col gap-6 items-center lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-4xl md:text-6xl font-pixel text-glitch-cyan glitch-text leading-tight" data-text="MACHINE_GHOST">
              MACHINE<br />
              <span className="text-glitch-magenta">GHOST</span>
            </h1>
            <div className="mt-4 p-2 border border-glitch-cyan/30 bg-glitch-cyan/5">
              <p className="text-[10px] text-glitch-cyan font-pixel uppercase leading-relaxed">
                STATUS: UNSTABLE<br />
                BUFFER: OVERFLOWING<br />
                ENTITY: DETECTED
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <MusicPlayer />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SnakeGame />
        </motion.div>
      </div>

      {/* Footer / Meta */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[8px] font-pixel text-glitch-cyan/20 uppercase">
        <span>ID: 0xDEADBEEF</span>
        <span className="animate-pulse">SIGNAL_LOST...</span>
        <span>LOC: VOID</span>
      </div>
    </div>
  );
}
