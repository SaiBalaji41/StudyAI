import React from 'react';

export default function AnimatedAuthBackground({ imageUrl }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: '#05050a', // Deep dark base
    }}>
      {/* The static 4k image with a subtle Ken Burns animation */}
      <div 
        className="auth-ken-burns"
        style={{
          position: 'absolute',
          inset: -20, // Negative inset to allow panning without showing edges
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Animated gradient orbs layered over the image for dynamic lighting */}
      <div className="auth-orb auth-orb-1" style={{ mixBlendMode: 'color-dodge' }}></div>
      <div className="auth-orb auth-orb-2" style={{ mixBlendMode: 'color-dodge' }}></div>
      <div className="auth-orb auth-orb-3" style={{ mixBlendMode: 'color-dodge' }}></div>
      
      {/* Glassmorphism overlay for that 4k premium feel */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(5,5,10,0.1), rgba(5,5,10,0.8))',
        zIndex: 1
      }}></div>

      {/* Subtle grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        zIndex: 2,
        opacity: 0.5
      }}></div>

      <style>{`
        .auth-ken-burns {
          animation: ken-burns 30s infinite alternate ease-in-out;
        }

        @keyframes ken-burns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          100% {
            transform: scale(1.1) translate(-2%, -2%);
          }
        }

        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.6;
          animation: auth-float 20s infinite ease-in-out alternate;
          z-index: 1;
        }

        .auth-orb-1 {
          width: 600px;
          height: 600px;
          background: #4338ca; /* primary-dark */
          top: -10%;
          left: -10%;
          animation-delay: 0s;
        }

        .auth-orb-2 {
          width: 500px;
          height: 500px;
          background: #14b8a6; /* secondary */
          bottom: -10%;
          right: -10%;
          animation-delay: -5s;
          animation-duration: 25s;
        }

        .auth-orb-3 {
          width: 400px;
          height: 400px;
          background: #8b5cf6; /* purple accent */
          top: 40%;
          left: 40%;
          animation-delay: -10s;
          animation-duration: 22s;
        }

        @keyframes auth-float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(10%, 15%) scale(1.1);
          }
          66% {
            transform: translate(-15%, 5%) scale(0.9);
          }
          100% {
            transform: translate(5%, -15%) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
