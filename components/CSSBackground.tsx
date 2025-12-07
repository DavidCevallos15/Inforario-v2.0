import React from 'react';

const Beam = ({ style }: { style?: React.CSSProperties }) => (
  <div className="beam" style={style} aria-hidden />
);

export const CSSBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`css-bg ${className || ''}`} aria-hidden>
      <div className="vignette" />
      <Beam style={{ left: '-10%', top: '-20%', width: '70vw', height: '60vh', background: 'linear-gradient(90deg,#00F0FF66,#7C3AED66)' }} />
      <Beam style={{ right: '-15%', top: '10%', width: '50vw', height: '50vh', background: 'linear-gradient(90deg,#FF006E55,#00F0FF55)' }} />
      <Beam style={{ left: '20%', bottom: '-10%', width: '40vw', height: '40vh', background: 'linear-gradient(90deg,#00F0FF44,#FFBE0B44)' }} />
      <div className="dot-grid" />
    </div>
  );
};

export default CSSBackground;
