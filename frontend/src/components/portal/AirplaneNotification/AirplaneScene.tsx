import React, { useEffect, useRef } from 'react';

/**
 * Component Hiển thị Máy bay 3D UTH Chibi chuẩn 100% theo ảnh tham chiếu của người dùng.
 * Thân máy bay mang logo UTH, University of Transport Ho Chi Minh City, dải viền vàng cam.
 * Kèm Hệ thống Hạt Khói 3D (Puff Smoke Trail) phụt ra liên tục từ đuôi máy bay.
 */
export const AirplaneScene: React.FC = () => {
  const smokeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Hiệu ứng hạt khói 3D phụt ra từ đuôi máy bay (Puff Smoke Trail 60fps)
  useEffect(() => {
    const canvas = smokeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      vx: number;
      vy: number;
    }> = [];

    let lastSpawn = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cứ 90ms sinh 1 chùm bọt khói mới từ vị trí đuôi máy bay (X=145, Y=62)
      if (time - lastSpawn > 90) {
        lastSpawn = time;
        particles.push({
          x: 142 + (Math.random() - 0.5) * 6,
          y: 60 + (Math.random() - 0.5) * 8,
          radius: 4 + Math.random() * 3,
          maxRadius: 18 + Math.random() * 10,
          alpha: 0.85,
          vx: 0.8 + Math.random() * 0.7, // Bay ngược về sau (sang phải)
          vy: (Math.random() - 0.5) * 0.4, // Dao động nhẹ lên xuống
        });
      }

      // Cập nhật và vẽ từng hạt khói
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.35; // Nở to dần
        p.alpha -= 0.016; // Mờ dần

        if (p.alpha <= 0 || p.radius >= p.maxRadius) {
          particles.splice(i, 1);
          continue;
        }

        // Vẽ quả cầu khói 3D múp míp (Radial Gradient tạo khối tròn mềm)
        const grad = ctx.createRadialGradient(
          p.x - p.radius * 0.3,
          p.y - p.radius * 0.3,
          p.radius * 0.1,
          p.x,
          p.y,
          p.radius
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
        grad.addColorStop(0.7, `rgba(240, 248, 255, ${p.alpha * 0.8})`);
        grad.addColorStop(1, `rgba(226, 232, 240, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative shrink-0 w-48 sm:w-56 h-28 sm:h-32 flex items-center justify-center pointer-events-none select-none">
      {/* 1. Canvas render hiệu ứng Khói 3D phụt ra từ sau đuôi máy bay */}
      <canvas
        ref={smokeCanvasRef}
        width={240}
        height={130}
        className="absolute -top-1 -right-8 w-60 h-32 pointer-events-none z-0"
      />

      {/* 2. Chiếc máy bay UTH 3D Chibi chuẩn 100% theo ảnh tham chiếu */}
      <div className="relative z-10 airplane-3d-chibi-float">
        <img
          src="/airplane_uth_3d.png"
          alt="UTH 3D Airplane"
          className="w-40 sm:w-46 h-auto drop-shadow-xl transform scale-x-[1.06] transition-transform"
          style={{
            filter: 'drop-shadow(0 12px 18px rgba(0, 105, 92, 0.28))',
          }}
        />
      </div>

      {/* Animation bồng bềnh êm ái cho máy bay */}
      <style>{`
        @keyframes chibiPlaneFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(-1.5deg);
          }
        }

        .airplane-3d-chibi-float {
          animation: chibiPlaneFloat 3s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};
