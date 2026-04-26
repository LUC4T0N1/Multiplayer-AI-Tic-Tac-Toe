const isMobile =
  typeof window !== 'undefined' &&
  (window.innerWidth <= 768 || navigator.maxTouchPoints > 1);

export default isMobile;
