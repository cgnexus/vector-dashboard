"use client";

import { useCallback, useEffect, useRef } from "react";

// Animation utility functions
export const createRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 600ms linear;
    background-color: rgba(255, 255, 255, 0.5);
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
  `;

  button.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
};

export const createShakeEffect = (element: HTMLElement) => {
  element.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
};

export const createSuccessParticles = (x: number, y: number) => {
  const particles = 12;
  const colors = ['#00ff88', '#00ffff', '#ff0080', '#ffff00'];
  
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = (i / particles) * Math.PI * 2;
    const velocity = 100 + Math.random() * 50;
    
    particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${x}px;
      top: ${y}px;
      box-shadow: 0 0 6px ${color};
    `;
    
    document.body.appendChild(particle);
    
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    particle.animate([
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1
      },
      {
        transform: `translate(${vx}px, ${vy}px) scale(0)`,
        opacity: 0
      }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => particle.remove();
  }
};

export const createFloatingText = (text: string, x: number, y: number, color = '#00ff88') => {
  const element = document.createElement('div');
  element.textContent = text;
  element.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    color: ${color};
    font-weight: bold;
    font-size: 14px;
    pointer-events: none;
    z-index: 9999;
    text-shadow: 0 0 10px ${color};
  `;
  
  document.body.appendChild(element);
  
  element.animate([
    {
      transform: 'translateY(0) scale(1)',
      opacity: 1
    },
    {
      transform: 'translateY(-50px) scale(1.2)',
      opacity: 0
    }
  ], {
    duration: 1000,
    easing: 'ease-out'
  }).onfinish = () => element.remove();
};

// Hook for intersection observer animations
export const useIntersectionAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.animation = 'slideInUp 0.6s ease-out forwards';
        }
      },
      { threshold }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return ref;
};

// Hook for number counting animation
export const useCountAnimation = (target: number, duration = 1000) => {
  const [current, setCurrent] = React.useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(target * easeOut);
    
    setCurrent(currentValue);
    
    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [target, duration]);
  
  useEffect(() => {
    startTimeRef.current = null;
    setCurrent(0);
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);
  
  return current;
};

// Konami code hook
export const useKonamiCode = (callback: () => void) => {
  
  const [, setSequence] = React.useState<string[]>([]);
  
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'KeyB', 'KeyA'
    ];
    
    const handleKeyPress = (event: KeyboardEvent) => {
      setSequence(prev => {
        const newSequence = [...prev, event.code].slice(-konamiCode.length);
        
        if (newSequence.length === konamiCode.length && 
            newSequence.every((key, index) => key === konamiCode[index])) {
          callback();
          return [];
        }
        
        return newSequence;
      });
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [callback]);
};

// Random encouraging messages
export const encouragingMessages = [
  "Processing your data with style!",
  "Crunching numbers at lightspeed...",
  "Calculating the impossible...",
  "Enhancing vectors with magic...",
  "Optimizing for maximum awesomeness...",
  "Loading your digital destiny...",
  "Compiling dreams into reality...",
  "Synchronizing with the matrix...",
  "Initializing cyber protocols...",
  "Activating neural networks..."
];

export const getRandomMessage = () => {
  return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
};

// CSS animations that will be added to globals.css
export const additionalAnimations = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 5px currentColor;
  }
  50% {
    box-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
  }
}

@keyframes tiltIn {
  0% {
    transform: rotateY(-10deg) rotateX(10deg);
    opacity: 0;
  }
  100% {
    transform: rotateY(0deg) rotateX(0deg);
    opacity: 1;
  }
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
}
`;