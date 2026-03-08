import React, { useEffect, useState } from 'react';
import './TopRabbitBanner.css';

type Props = {
  // How long each image shows (ms)
  intervalMs?: number;
  // Optional list of image URLs (if you want to override the defaults)
  images?: string[];
  // Height of the banner (px or any CSS unit)
  height?: string;
};

const DEFAULT_IMAGES = [
  '/assets/rabbits/tier-diamond-warren.jpg',
  '/assets/rabbits/tier-gold-rabbit.jpg',
  '/assets/rabbits/tier-junior-hopper.jpg',
  '/assets/rabbits/tier-platinum-hare.jpg',
];

export default function TopRabbitBanner({
  intervalMs = 6000,
  images = DEFAULT_IMAGES,
  height = '260px',
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images, intervalMs]);

  return (
    <div className="top-rabbit-banner" style={{ height }}>
      {images.map((src, i) => (
        <div
          key={src + i}
          className={`banner-slide ${i === index ? 'active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
          role="img"
          aria-label={`Rabbit background ${i + 1}`}
        />
      ))}

      <div className="banner-overlay">
        <div className="banner-content">
          <h1 className="banner-title">Rabbit Returns</h1>
          <p className="banner-sub">Invest. Earn. Win.</p>
        </div>
      </div>
    </div>
  );
}
