// ============================================================================
// JDR-BAB APPLICATION - ANIMATION ENHANCER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // ANIMATION ENHANCER - DYNAMIC ANIMATIONS
  // ========================================
  window.AnimationEnhancer = {

    /**
     * Initialize animation enhancer
     */
    init() {
      this.setupIntersectionObserver();
      this.setupScrollAnimations();
      this.setupHoverEnhancements();
      this.setupParallaxEffects();
      this.setupStaggeredAnimations();
      this.setupPerformanceOptimizations();
    },

    /**
     * Setup intersection observer for reveal animations
     */
    setupIntersectionObserver() {
      if (!('IntersectionObserver' in window)) return;

      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -20% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const animationType = element.dataset.animate || 'fadeInUp';
            const delay = element.dataset.delay || '0';

            // Add animation class with delay
            setTimeout(() => {
              element.classList.add('animate-in', animationType);
              element.style.opacity = '1';
            }, parseInt(delay));

            observer.unobserve(element);
          }
        });
      }, observerOptions);

      // Observe all cards and major elements (except treasure tables which have their own animation)
      document.querySelectorAll('.card:not(#tables-tresors-container .card), .panel, .toc-section').forEach(el => {
        if (!el.closest('#tables-tresors-container')) {
          el.style.opacity = '0';
          observer.observe(el);
        }
      });

      // Special observer for images with 3D entrance effects
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const delay = Math.random() * 300; // Random delay up to 300ms

            setTimeout(() => {
              img.classList.add('image-revealed');
              img.style.opacity = '1';
              img.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
            }, delay);

            imageObserver.unobserve(img);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.3
      });

      // Observe all images for reveal animation
      document.querySelectorAll('.illus img').forEach(img => {
        img.style.opacity = '0';
        img.style.transform = 'perspective(1000px) rotateX(-30deg) rotateY(45deg) translateZ(-50px) scale(0.8)';
        img.style.transition = 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        imageObserver.observe(img);
      });

      // Special handling for treasure table links
      document.querySelectorAll('.treasure-table-link').forEach(link => {
        link.addEventListener('click', (e) => {
          this.createRipple(link, e);
          this.pulse(link, 1000);
        });
      });
    },

    /**
     * Setup scroll-based animations
     */
    setupScrollAnimations() {
      let ticking = false;

      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this.updateScrollAnimations();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
    },

    /**
     * Update animations based on scroll position
     */
    updateScrollAnimations() {
      const scrollY = window.pageYOffset;
      const windowHeight = window.innerHeight;

      // Parallax effect for headers
      document.querySelectorAll('.spell-title, .page-header').forEach(header => {
        const rect = header.getBoundingClientRect();
        if (rect.top < windowHeight && rect.bottom > 0) {
          const speed = 0.5;
          const yPos = -(scrollY * speed);
          header.style.transform = `translateY(${yPos}px)`;
        }
      });

      // Fade effect for cards as they scroll out
      document.querySelectorAll('.card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardTop = rect.top;
        const cardHeight = rect.height;

        if (cardTop < -cardHeight * 0.3) {
          const opacity = Math.max(0, 1 - Math.abs(cardTop) / (cardHeight * 2));
          card.style.opacity = opacity;
        } else if (cardTop > windowHeight + cardHeight * 0.3) {
          const opacity = Math.max(0, 1 - (cardTop - windowHeight) / (cardHeight * 2));
          card.style.opacity = opacity;
        } else {
          card.style.opacity = 1;
        }
      });
    },

    /**
     * Enhanced hover effects with dynamic calculations
     */
    setupHoverEnhancements() {
      document.addEventListener('mousemove', (e) => {
        // Dynamic hover effects for cards
        document.querySelectorAll('.card').forEach(card => {
          if (card.matches(':hover')) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `
              perspective(1000px)
              rotateX(${rotateX}deg)
              rotateY(${rotateY}deg)
              translateY(-8px)
              scale(1.02)
            `;
          }
        });

        // Enhanced 3D tracking for images
        document.querySelectorAll('.illus img').forEach(img => {
          if (img.matches(':hover') && !img.closest('.card')) {
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // More dramatic rotation for standalone images
            const rotateX = (y - centerY) / 6;
            const rotateY = (centerX - x) / 6;
            const translateZ = Math.max(20, Math.min(60, Math.abs(rotateX) + Math.abs(rotateY)));

            // Determine image type for specialized effects
            const isSpellImage = img.closest('.illus-spell');
            const isClassImage = img.closest('.illus-class, .illus-subclass');
            const isDonImage = img.closest('.illus-don');

            let scale = 1.08;
            let maxRotate = 15;

            if (isSpellImage) {
              scale = 1.12;
              maxRotate = 10;
            } else if (isClassImage) {
              scale = 1.1;
              maxRotate = 12;
            } else if (isDonImage) {
              scale = 1.06;
              maxRotate = 18;
            }

            const clampedRotateX = Math.max(-maxRotate, Math.min(maxRotate, rotateX));
            const clampedRotateY = Math.max(-maxRotate, Math.min(maxRotate, rotateY));

            img.style.transform = `
              perspective(1200px)
              rotateX(${clampedRotateX}deg)
              rotateY(${clampedRotateY}deg)
              translateZ(${translateZ}px)
              scale(${scale})
            `;
          }
        });
      });

      // Reset transform when not hovering
      document.addEventListener('mouseleave', (e) => {
        if (e.target.classList.contains('card')) {
          e.target.style.transform = '';
        }
        if (e.target.tagName === 'IMG' && e.target.closest('.illus')) {
          e.target.style.transform = '';
        }
      }, true);
    },

    /**
     * Setup subtle parallax effects
     */
    setupParallaxEffects() {
      let ticking = false;

      const handleMouseMove = (e) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            // Subtle parallax for background elements
            document.querySelectorAll('.illus img').forEach((img, index) => {
              const speed = (index % 3 + 1) * 0.5;
              const xOffset = (x - 0.5) * speed;
              const yOffset = (y - 0.5) * speed;

              img.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            });

            ticking = false;
          });
          ticking = true;
        }
      };

      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    },

    /**
     * Setup staggered animations for grid layouts
     */
    setupStaggeredAnimations() {
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };

      const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const grid = entry.target;
            const cards = grid.querySelectorAll('.card');

            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-in');
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              }, index * 100); // Stagger by 100ms
            });

            gridObserver.unobserve(grid);
          }
        });
      }, observerOptions);

      // Observe grid containers
      document.querySelectorAll('.grid').forEach(grid => {
        // Prepare cards for animation
        grid.querySelectorAll('.card').forEach(card => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(30px)';
          card.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });

        gridObserver.observe(grid);
      });
    },

    /**
     * Performance optimizations for animations
     */
    setupPerformanceOptimizations() {
      // Reduce animations on low-end devices
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        document.documentElement.classList.add('reduce-animations');
      }

      // Battery API optimization
      if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
          const updateAnimations = () => {
            if (battery.level < 0.2 && !battery.charging) {
              document.documentElement.classList.add('battery-save-mode');
            } else {
              document.documentElement.classList.remove('battery-save-mode');
            }
          };

          battery.addEventListener('levelchange', updateAnimations);
          battery.addEventListener('chargingchange', updateAnimations);
          updateAnimations();
        });
      }

      // Connection API optimization
      if ('connection' in navigator) {
        const updateForConnection = () => {
          const connection = navigator.connection;
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            document.documentElement.classList.add('slow-connection');
          } else {
            document.documentElement.classList.remove('slow-connection');
          }
        };

        navigator.connection.addEventListener('change', updateForConnection);
        updateForConnection();
      }
    },

    /**
     * Animate element entrance
     */
    animateIn(element, animationType = 'fadeInUp', delay = 0) {
      setTimeout(() => {
        element.classList.add('animate-in', animationType);
        element.style.opacity = '1';
      }, delay);
    },

    /**
     * Animate element exit
     */
    animateOut(element, animationType = 'fadeOutDown') {
      return new Promise((resolve) => {
        element.classList.add('animate-out', animationType);
        element.addEventListener('animationend', () => {
          element.remove();
          resolve();
        }, { once: true });
      });
    },

    /**
     * Create ripple effect
     */
    createRipple(element, event) {
      const ripple = document.createElement('span');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: none;
        z-index: 1000;
      `;

      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    },

    /**
     * Shake element (for errors)
     */
    shake(element) {
      element.classList.add('shake-animation');
      setTimeout(() => {
        element.classList.remove('shake-animation');
      }, 500);
    },

    /**
     * Pulse element (for notifications)
     */
    pulse(element, duration = 2000) {
      element.classList.add('pulse-animation');
      setTimeout(() => {
        element.classList.remove('pulse-animation');
      }, duration);
    },

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, offset = 0) {
      const targetPosition = element.offsetTop - offset;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const duration = Math.min(Math.abs(distance) * 2, 1000); // Max 1s
      let start = null;

      const animation = (currentTime) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);

        window.scrollTo(0, run);

        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    },

    /**
     * Easing function for smooth animations
     */
    easeInOutQuad(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    },

    /**
     * Animate spell filtering with staggered effects
     */
    animateSpellFilter(visibleCards, hiddenCards) {
      // Animate out hidden cards first
      hiddenCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('spell-filtered-hidden');
        }, index * 50);
      });

      // Then animate in visible cards
      setTimeout(() => {
        visibleCards.forEach((card, index) => {
          card.classList.remove('spell-filtered-hidden');
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
          }, index * 30);
        });
      }, hiddenCards.length * 50 + 100);
    },

    /**
     * Enhanced treasure table reveal animation
     */
    animateTreasureTableReveal(container) {
      const cards = container.querySelectorAll('.card');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) scale(0.9)';

        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
          card.style.transition = 'opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        }, index * 100);
      });
    }
  };

  // Add CSS for animation classes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    .shake-animation {
      animation: wiggle 0.5s ease-in-out;
    }

    .pulse-animation {
      animation: pulse 2s ease-in-out infinite;
    }

    .animate-in {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    .animate-out {
      opacity: 0 !important;
      transform: translateY(-20px) !important;
    }

    /* Performance optimizations */
    .reduce-animations * {
      animation-duration: 0.1s !important;
      transition-duration: 0.1s !important;
    }

    .battery-save-mode * {
      animation: none !important;
      transition: none !important;
    }

    .slow-connection * {
      animation-duration: 0.2s !important;
      transition-duration: 0.2s !important;
    }
  `;
  document.head.appendChild(style);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.AnimationEnhancer.init();
    });
  } else {
    window.AnimationEnhancer.init();
  }

})();