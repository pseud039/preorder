import { useEffect, useRef } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    audioRef.current.volume = 0.8;
    
    // Preload audio files
    const preloadSounds = [
      '/sounds/new-order.mp3',
      '/sounds/success.mp3',
      '/sounds/alert.mp3',
      '/sounds/notification.mp3'
    ];
    
    preloadSounds.forEach(src => {
      const audio = new Audio(src);
      audio.preload = 'auto';
    });
  }, []);

  const playSound = (type: string = 'default') => {
    if (!audioRef.current) return;

    // Map notification types to sound files
    const soundMap: Record<string, string> = {
      'ORDER_PLACED': '/sounds/new-order.mp3',        // High priority
      'ORDER_ACCEPTED': '/sounds/success.mp3',
      'ORDER_REJECTED': '/sounds/alert.mp3',
      'PAYMENT_REQUIRED': '/sounds/alert.mp3',
      'PAYMENT_RECEIVED': '/sounds/success.mp3',
      'ORDER_PREPARING': '/sounds/notification.mp3',
      'ORDER_READY': '/sounds/success.mp3',
      'ORDER_COMPLETED': '/sounds/success.mp3',
      'ORDER_EXPIRED': '/sounds/alert.mp3',
      'PAYMENT_EXPIRED': '/sounds/alert.mp3',
      'default': '/sounds/notification.mp3'
    };

    const soundFile = soundMap[type] || soundMap.default;
    
    // Reset and play
    audioRef.current.src = soundFile;
    audioRef.current.currentTime = 0;
    
    audioRef.current.play().catch(error => {
      console.warn('Audio playback failed:', error);
      // Fallback: Try to play after user interaction
      document.addEventListener('click', () => {
        audioRef.current?.play().catch(() => {});
      }, { once: true });
    });
  };

  return { playSound };
};