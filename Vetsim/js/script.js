'use strict';

const CONFIG = {
    animations: {
        duration: 800,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        stagger: 100
    },
    hero: {
        autoPlay: true,
        duration: 8000,
        transition: 1000
    },
    scroll: {
        threshold: 100,
        debounce: 16
    },
    counters: {
        duration: 2000,
        easing: 'easeOutQuart'
    }
};

class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    static easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static isElementInViewport(el, threshold = 0) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        return (
            rect.top <= windowHeight - threshold &&
            rect.bottom >= threshold
        );
    }

    static createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    }

    static addMultipleEventListeners(element, events, handler) {
        events.split(' ').forEach(event => 
            element.addEventListener(event, handler)
        );
    }
}

class DirectManager {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: CONFIG.animations.duration,
                easing: CONFIG.animations.easing,
                once: true,
                mirror: false,
                offset: 50,
                delay: 100
            });
        }

        navigationManager.init();
        heroManager.init();
        statsManager.init();
        galleryManager.init();
        scrollManager.init();
        interactionManager.init();
        
        document.body.classList.add('loaded');
    }
}

class NavigationManager {
    constructor() {
        this.nav = document.getElementById('premiumNav');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileToggle = document.getElementById('mobileMenuToggle');
        this.isScrolled = false;
        this.activeSection = 'hero';
    }

    init() {
        this.bindEvents();
        this.updateActiveLink();
    }

    bindEvents() {
        // Smooth scroll for navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    this.scrollToElement(targetElement);
                    this.setActiveLink(link);
                }
            });
        });

        // Scroll event for nav styling
        const scrollHandler = Utils.throttle(() => {
            this.handleScroll();
        }, CONFIG.scroll.debounce);

        window.addEventListener('scroll', scrollHandler, { passive: true });

        // Mobile menu toggle
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    handleScroll() {
        const scrollTop = window.pageYOffset;
        const shouldBeScrolled = scrollTop > CONFIG.scroll.threshold;

        if (shouldBeScrolled !== this.isScrolled) {
            this.isScrolled = shouldBeScrolled;
            this.nav.classList.toggle('scrolled', this.isScrolled);
        }

        // Update active section
        this.updateActiveSection();
    }

    updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + scrollTop;
            const sectionHeight = rect.height;

            if (scrollTop >= sectionTop - windowHeight / 3 && 
                scrollTop < sectionTop + sectionHeight - windowHeight / 3) {
                const sectionId = section.getAttribute('id');
                if (sectionId !== this.activeSection) {
                    this.activeSection = sectionId;
                    this.updateActiveLink();
                }
            }
        });
    }

    updateActiveLink() {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === `#${this.activeSection}`;
            link.classList.toggle('active', isActive);
        });
    }

    setActiveLink(clickedLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');
    }

    scrollToElement(element) {
        const navHeight = this.nav.offsetHeight;
        const elementTop = element.offsetTop - navHeight;
        
        window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
        });
    }

    toggleMobileMenu() {
        // Implementation for mobile menu (if needed)
        console.log('Mobile menu toggle');
    }
}

class HeroManager {
    constructor() {
        this.heroSection = document.querySelector('.hero-section');
        this.slides = document.querySelectorAll('.hero-slide');
        this.indicators = document.querySelectorAll('.hero-indicator');
        this.prevButton = document.getElementById('heroPrev');
        this.nextButton = document.getElementById('heroNext');
        
        this.currentSlide = 0;
        this.isTransitioning = false;
        this.autoPlayInterval = null;
        this.isPaused = false;
    }

    init() {
        if (!this.heroSection) return;

        this.setupSlideBackgrounds();
        this.bindEvents();
        this.startAutoPlay();
        this.preloadImages();
    }

    setupSlideBackgrounds() {
        this.slides.forEach(slide => {
            const bgImage = slide.dataset.bg;
            if (bgImage) {
                slide.style.backgroundImage = `url(${bgImage})`;
            }
        });
    }

    bindEvents() {
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.previousSlide();
            });
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.nextSlide();
            });
        }

        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });

        this.heroSection.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
        });

        this.heroSection.addEventListener('mouseleave', () => {
            this.resumeAutoPlay();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });

        this.addTouchSupport();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else {
                this.resumeAutoPlay();
            }
        });
    }

    addTouchSupport() {
        let startX = 0;
        let endX = 0;
        const threshold = 50;

        this.heroSection.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            this.pauseAutoPlay();
        }, { passive: true });

        this.heroSection.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }

            setTimeout(() => this.resumeAutoPlay(), 1000);
        }, { passive: true });
    }

    preloadImages() {
        this.slides.forEach(slide => {
            const bgImage = slide.dataset.bg;
            if (bgImage) {
                const img = new Image();
                img.src = bgImage;
            }
        });
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide) return;

        this.isTransitioning = true;
        
        // Update slides
        this.slides[this.currentSlide].classList.remove('active');
        this.slides[index].classList.add('active');

        // Update indicators
        this.indicators[this.currentSlide]?.classList.remove('active');
        this.indicators[index]?.classList.add('active');

        this.currentSlide = index;

        // Reset transition lock
        setTimeout(() => {
            this.isTransitioning = false;
        }, CONFIG.hero.transition);

        // Restart autoplay
        this.restartAutoPlay();
    }

    startAutoPlay() {
        if (!CONFIG.hero.autoPlay) return;
        
        this.autoPlayInterval = setInterval(() => {
            if (!this.isPaused) {
                this.nextSlide();
            }
        }, CONFIG.hero.duration);
    }

    pauseAutoPlay() {
        this.isPaused = true;
    }

    resumeAutoPlay() {
        this.isPaused = false;
    }

    restartAutoPlay() {
        clearInterval(this.autoPlayInterval);
        this.startAutoPlay();
    }

    destroy() {
        clearInterval(this.autoPlayInterval);
    }
}

class StatsManager {
    constructor() {
        this.statNumbers = document.querySelectorAll('.stat-number');
        this.hasAnimated = false;
    }

    init() {
        if (this.statNumbers.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.hasAnimated = true;
                    this.animateCounters();
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px 0px -50px 0px'
        });

        this.statNumbers[0]?.parentElement.parentElement && 
        observer.observe(this.statNumbers[0].parentElement.parentElement);
    }

    animateCounters() {
        this.statNumbers.forEach((numberElement, index) => {
            const targetValue = parseInt(numberElement.dataset.count) || 0;
            const startTime = performance.now();
            const delay = index * CONFIG.animations.stagger;

            setTimeout(() => {
                this.animateNumber(numberElement, targetValue, startTime);
            }, delay);
        });
    }

    animateNumber(element, target, startTime) {
        const duration = CONFIG.counters.duration;
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = Utils.easeOutQuart(progress);
            
            const currentValue = Math.floor(target * easedProgress);
            element.textContent = this.formatNumber(currentValue);

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = this.formatNumber(target);
            }
        };

        requestAnimationFrame(updateNumber);
    }

    formatNumber(number) {
        // Add formatting logic if needed (e.g., thousands separator)
        return number.toString();
    }
}

class GalleryManager {
    constructor() {
        this.galleryContainer = document.querySelector('.gallery-slider-container');
        this.gallerySlider = document.getElementById('gallerySlider');
        this.slides = document.querySelectorAll('.gallery-slide');
        this.indicators = document.querySelectorAll('.gallery-indicator');
        this.prevButton = document.getElementById('galleryPrev');
        this.nextButton = document.getElementById('galleryNext');
        
        this.currentSlide = 0;
        this.isTransitioning = false;
        this.autoPlayInterval = null;
        this.isPaused = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchThreshold = 50;
        this.autoPlayDuration = 6000;
    }

    init() {
        if (!this.galleryContainer || this.slides.length === 0) return;

        this.bindEvents();
        this.updateSlides();
        this.startAutoPlay();
        this.setupIntersectionObserver();
    }

    bindEvents() {
        // Navigation buttons
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.previousSlide();
            });
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.nextSlide();
            });
        }

        // Indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });

        // Pause on hover
        this.galleryContainer.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
        });

        this.galleryContainer.addEventListener('mouseleave', () => {
            this.resumeAutoPlay();
        });

        // Touch/Swipe support for mobile
        this.addTouchSupport();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (Utils.isElementInViewport(this.galleryContainer, 200)) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.previousSlide();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextSlide();
                }
            }
        });

        // Page visibility API
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else {
                this.resumeAutoPlay();
            }
        });

        // Window resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            this.updateSlides();
        }, 250));
    }

    addTouchSupport() {
        // Touch start
        this.galleryContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.pauseAutoPlay();
            
            // Add visual feedback
            this.galleryContainer.style.cursor = 'grabbing';
        }, { passive: true });

        // Touch move
        this.galleryContainer.addEventListener('touchmove', (e) => {
            this.touchEndX = e.touches[0].clientX;
            
            // Optional: Add visual feedback during swipe
            const diffX = this.touchStartX - this.touchEndX;
            const intensity = Math.min(Math.abs(diffX) / 100, 1);
            
            // Subtle transform preview
            if (Math.abs(diffX) > 10) {
                this.gallerySlider.style.transform = `translateX(${-diffX * 0.1}px)`;
            }
        }, { passive: true });

        // Touch end
        this.galleryContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            const diffX = this.touchStartX - this.touchEndX;

            // Reset transform
            this.gallerySlider.style.transform = '';
            this.galleryContainer.style.cursor = '';

            // Handle swipe
            if (Math.abs(diffX) > this.touchThreshold) {
                if (diffX > 0) {
                    // Swipe left (next slide)
                    this.nextSlide();
                } else {
                    // Swipe right (previous slide)
                    this.previousSlide();
                }
            }

            // Resume autoplay after delay
            setTimeout(() => {
                this.resumeAutoPlay();
            }, 2000);
        }, { passive: true });

        // Prevent context menu on long press
        this.galleryContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupIntersectionObserver() {
        // Only run autoplay when gallery is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.resumeAutoPlay();
                } else {
                    this.pauseAutoPlay();
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-50px 0px'
        });

        observer.observe(this.galleryContainer);
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide) return;

        this.isTransitioning = true;
        this.currentSlide = index;
        
        this.updateSlides();
        this.updateIndicators();
        
        // Reset transition lock - updated for premium smooth transitions
        setTimeout(() => {
            this.isTransitioning = false;
        }, 1200);

        // Restart autoplay
        this.restartAutoPlay();
    }

    updateSlides() {
        this.slides.forEach((slide, index) => {
            // Remove all position classes
            slide.classList.remove('active', 'next', 'prev');
            
            // Calculate relative position
            const isActive = index === this.currentSlide;
            const isNext = index === (this.currentSlide + 1) % this.slides.length;
            const isPrev = index === (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            
            if (isActive) {
                slide.classList.add('active');
            } else if (isNext) {
                slide.classList.add('next');
            } else if (isPrev) {
                slide.classList.add('prev');
            }
            
            // Set z-index for proper layering
            if (isActive) {
                slide.style.zIndex = '3';
            } else if (isNext || isPrev) {
                slide.style.zIndex = '2';
            } else {
                slide.style.zIndex = '1';
            }
        });
    }

    updateIndicators() {
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (!this.isPaused && !this.isTransitioning) {
                this.nextSlide();
            }
        }, this.autoPlayDuration);
    }

    pauseAutoPlay() {
        this.isPaused = true;
    }

    resumeAutoPlay() {
        this.isPaused = false;
    }

    restartAutoPlay() {
        clearInterval(this.autoPlayInterval);
        this.startAutoPlay();
    }

    destroy() {
        clearInterval(this.autoPlayInterval);
        this.isPaused = true;
    }

    // Public methods for external control
    play() {
        this.isPaused = false;
        if (!this.autoPlayInterval) {
            this.startAutoPlay();
        }
    }

    pause() {
        this.pauseAutoPlay();
    }

    getCurrentSlide() {
        return this.currentSlide;
    }

    getTotalSlides() {
        return this.slides.length;
    }
}

class ScrollManager {
    constructor() {
        this.dynamicScrollButton = document.getElementById('dynamicScrollBtn');
        this.heroSection = document.getElementById('hero');
        this.aboutSection = document.getElementById('about');
        this.isScrollUp = false;
        this.isScrolling = false;
        this.visibilityInterval = null;
    }

    init() {
        if (!this.dynamicScrollButton) return;

        this.showButton();
        this.startVisibilityWatcher();
        
        this.bindEvents();
        this.handleScroll();
    }

    showButton() {
        if (this.dynamicScrollButton) {
            this.dynamicScrollButton.style.opacity = '1';
            this.dynamicScrollButton.style.visibility = 'visible';
            this.dynamicScrollButton.style.display = 'flex';
            this.dynamicScrollButton.style.pointerEvents = 'auto';
            
            // Preserve current transform if in animation
            if (!this.isScrolling) {
                this.dynamicScrollButton.style.transform = 'scale(1)';
            }
        }
    }

    startVisibilityWatcher() {
        // Continuous monitoring to ensure button never disappears
        this.visibilityInterval = setInterval(() => {
            if (this.dynamicScrollButton) {
                const computedStyle = window.getComputedStyle(this.dynamicScrollButton);
                const opacity = parseFloat(computedStyle.opacity);
                const visibility = computedStyle.visibility;
                
                // Force show if button becomes invisible
                if (opacity < 1 || visibility === 'hidden') {
                    this.showButton();
                }
            }
        }, 100); // Check every 100ms
    }

    bindEvents() {
        // More frequent scroll handler for better responsiveness
        const scrollHandler = Utils.throttle(() => {
            this.handleScroll();
        }, 8); // Increased frequency

        window.addEventListener('scroll', scrollHandler, { passive: true });

        // Dynamic scroll button click with improved handling
        this.dynamicScrollButton.addEventListener('click', () => {
            this.handleDynamicScroll();
        });

        // Additional event listeners to maintain visibility
        window.addEventListener('resize', () => {
            this.showButton();
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.showButton();
            }
        });
    }

    handleScroll() {
        const scrollTop = window.pageYOffset;

        // Always ensure button is visible first
        this.showButton();
        
        // Dynamic scroll button logic
        this.updateDynamicScrollButton(scrollTop);
        
        // Force visibility after update
        this.showButton();
    }

    updateDynamicScrollButton(scrollTop) {
        if (!this.dynamicScrollButton || !this.heroSection || !this.aboutSection) return;

        // Get hero section end position
        const heroHeight = this.heroSection.offsetHeight;
        const heroEnd = heroHeight;
        
        // Get about section position  
        const aboutTop = this.aboutSection.offsetTop;

        // Determine arrow direction:
        // - Down arrow: when at top/hero section (before about section)
        // - Up arrow: when at about section or below
        const shouldBeScrollUp = scrollTop >= (aboutTop - window.innerHeight / 3);

        // Update arrow direction with smooth animation
        if (shouldBeScrollUp !== this.isScrollUp) {
            this.isScrollUp = shouldBeScrollUp;
            this.isScrolling = true;
            
            // Ensure button is visible before animation
            this.showButton();
            
            // Add smooth rotation animation with preserved visibility
            this.dynamicScrollButton.style.transform = 'scale(0.8)';
            this.dynamicScrollButton.style.opacity = '1';
            this.dynamicScrollButton.style.visibility = 'visible';
            
            setTimeout(() => {
                this.dynamicScrollButton.classList.toggle('scroll-up', this.isScrollUp);
                this.dynamicScrollButton.style.transform = 'scale(1)';
                this.dynamicScrollButton.style.opacity = '1';
                this.dynamicScrollButton.style.visibility = 'visible';
                this.isScrolling = false;
                
                // Final visibility check
                setTimeout(() => {
                    this.showButton();
                }, 50);
            }, 150);
        }
    }

    handleDynamicScroll() {
        if (!this.heroSection || !this.aboutSection) return;

        const navHeight = document.getElementById('premiumNav')?.offsetHeight || 80;
        this.isScrolling = true;

        // Always ensure button stays visible during entire process
        this.showButton();

        // Create a visibility maintenance interval during scroll
        const maintainVisibility = setInterval(() => {
            this.showButton();
        }, 50);

        if (this.isScrollUp) {
            // Scroll to hero section (top of page)
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Scroll to about section
            const aboutTop = this.aboutSection.offsetTop - navHeight;
            window.scrollTo({
                top: aboutTop,
                behavior: 'smooth'
            });
        }

        // Detect scroll completion and maintain visibility
        let lastScrollTop = window.pageYOffset;
        let scrollCheckCount = 0;
        const maxChecks = 50; // Maximum 2.5 seconds

        const checkScrollComplete = () => {
            const currentScrollTop = window.pageYOffset;
            
            if (Math.abs(currentScrollTop - lastScrollTop) < 1 || scrollCheckCount >= maxChecks) {
                // Scroll completed
                clearInterval(maintainVisibility);
                this.isScrolling = false;
                this.showButton();
                
                // Additional visibility reinforcement
                setTimeout(() => {
                    this.showButton();
                    this.handleScroll(); // Refresh state
                }, 100);
                
                return;
            }
            
            lastScrollTop = currentScrollTop;
            scrollCheckCount++;
            this.showButton(); // Ensure visibility during scroll
            
            setTimeout(checkScrollComplete, 50);
        };

        // Start monitoring scroll completion
        setTimeout(checkScrollComplete, 100);
    }

    destroy() {
        if (this.visibilityInterval) {
            clearInterval(this.visibilityInterval);
        }
    }
}

class InteractionManager {
    constructor() {
        this.rippleElements = document.querySelectorAll('[class*="btn"], [class*="button"]');
    }

    init() {
        this.setupRippleEffects();
        this.setupHoverEffects();
        this.setupFormEnhancements();
        this.setupImageLazyLoading();
        this.setupAccessibilityFeatures();
    }

    setupRippleEffects() {
        this.rippleElements.forEach(element => {
            element.addEventListener('click', (e) => {
                this.createRipple(e, element);
            });
        });
    }

    createRipple(event, element) {
        if (element.querySelector('.btn-ripple')) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = Utils.createElement('div', 'ripple-effect');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        this.addRippleKeyframes();

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    addRippleKeyframes() {
        if (document.getElementById('ripple-keyframes')) return;

        const style = Utils.createElement('style', null, `
            @keyframes ripple-animation {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `);
        style.id = 'ripple-keyframes';
        document.head.appendChild(style);
    }

    setupHoverEffects() {
        // Enhanced hover effects for service cards
        const serviceCards = document.querySelectorAll('.service-card, .featured-service, .gallery-item');
        
        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.enhanceCardHover(card, true);
            });

            card.addEventListener('mouseleave', () => {
                this.enhanceCardHover(card, false);
            });
        });
    }

    enhanceCardHover(card, isHovering) {
        const icon = card.querySelector('i, .service-icon, .card-icon');
        
        if (icon) {
            if (isHovering) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            } else {
                icon.style.transform = '';
            }
        }
    }

    setupFormEnhancements() {
        // Enhanced form interactions (if forms are added later)
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement?.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement?.classList.remove('focused');
                if (input.value) {
                    input.parentElement?.classList.add('filled');
                } else {
                    input.parentElement?.classList.remove('filled');
                }
            });
        });
    }

    setupImageLazyLoading() {
        // Enhanced image loading with progressive blur
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        img.style.filter = 'blur(10px)';
        img.style.transition = 'filter 0.3s ease';

        const imageLoader = new Image();
        imageLoader.onload = () => {
            img.src = src;
            img.style.filter = 'blur(0)';
            img.classList.add('loaded');
        };
        imageLoader.src = src;
    }

    setupAccessibilityFeatures() {
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Tab navigation enhancement
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
            
            // Emergency call shortcut (Ctrl + E)
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                const emergencyButton = document.querySelector('a[href="tel:+905070082070"]');
                emergencyButton?.click();
            }
        });

        // Remove keyboard navigation class on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Enhanced focus indicators
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.setAttribute('data-focused', 'true');
            });

            element.addEventListener('blur', () => {
                element.removeAttribute('data-focused');
            });
        });
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: [],
            timing: {}
        };
        this.isMonitoring = false;
    }

    start() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        this.monitorFPS();
        
        if (performance.memory) {
            this.monitorMemory();
        }

        this.recordPageTiming();
    }

    monitorFPS() {
        let lastTime = performance.now();
        let frames = 0;

        const tick = (currentTime) => {
            frames++;
            
            if (currentTime >= lastTime + 1000) {
                this.metrics.fps.push(frames);
                frames = 0;
                lastTime = currentTime;
                
                // Keep only last 60 seconds of data
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }
            }

            if (this.isMonitoring) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }

    monitorMemory() {
        setInterval(() => {
            if (performance.memory) {
                this.metrics.memory.push({
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });

                // Keep only last 5 minutes of data
                if (this.metrics.memory.length > 300) {
                    this.metrics.memory.shift();
                }
            }
        }, 1000);
    }

    recordPageTiming() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                this.metrics.timing = {
                    dns: timing.domainLookupEnd - timing.domainLookupStart,
                    connect: timing.connectEnd - timing.connectStart,
                    response: timing.responseEnd - timing.responseStart,
                    dom: timing.domContentLoadedEventEnd - timing.navigationStart,
                    load: timing.loadEventEnd - timing.navigationStart
                };

                if (process.env.NODE_ENV === 'development') {
                    console.log('Performance Metrics:', this.metrics.timing);
                }
            }, 0);
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            averageFPS: this.metrics.fps.length > 0 
                ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length 
                : 0
        };
    }

    stop() {
        this.isMonitoring = false;
    }
}

const directManager = new DirectManager();
const navigationManager = new NavigationManager();
const heroManager = new HeroManager();
const statsManager = new StatsManager();
const galleryManager = new GalleryManager();
const scrollManager = new ScrollManager();
const interactionManager = new InteractionManager();
const performanceMonitor = new PerformanceMonitor();

class VetSimApp {
    constructor() {
        this.isInitialized = false;
        this.managers = {
            direct: directManager,
            navigation: navigationManager,
            hero: heroManager,
            stats: statsManager,
            gallery: galleryManager,
            scroll: scrollManager,
            interaction: interactionManager,
            performance: performanceMonitor
        };
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.managers.performance.start();
        }

        this.managers.direct.init();

        this.setupErrorHandling();

        this.showConsoleGreeting();
    }

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('VetSim Error:', e.error);
            // Could send to error tracking service
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('VetSim Unhandled Promise Rejection:', e.reason);
            // Could send to error tracking service
        });
    }

    showConsoleGreeting() {
        const styles = [
            'color: #6366f1',
            'font-size: 20px',
            'font-weight: bold',
            'text-shadow: 2px 2px 4px rgba(0,0,0,0.3)'
        ].join(';');

        console.log('%c🐾 VetSim Premium Veterinary Clinic', styles);
        console.log('%cWebsite loaded successfully! Premium experience activated.', 'color: #10b981; font-size: 14px;');
        console.log('%c💝 Made with love for our furry friends', 'color: #ec4899; font-size: 12px; font-style: italic;');
    }

    destroy() {
        // Cleanup all managers
        Object.values(this.managers).forEach(manager => {
            if (typeof manager.destroy === 'function') {
                manager.destroy();
            }
        });
        this.isInitialized = false;
    }
}

const vetSimApp = new VetSimApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        vetSimApp.init();
    });
} else {
    vetSimApp.init();
}

window.VetSimApp = vetSimApp;

function openMaps() {
    const address = "VetSim Veteriner Kliniği, Nergiz, Girne Blv No: 131/A, 35580 Karşıyaka/İzmir";
    const lat = "38.461331";
    const lng = "27.107659";
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        // iOS için Apple Maps'te yol tarifi (sadece hedef konum)
        const appleMapsUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        window.location.href = appleMapsUrl;
        
        // Apple Maps açılamazsa Google Maps'i aç
        setTimeout(() => {
            window.open(fallbackUrl, '_blank');
        }, 1500);
        
    } else if (isAndroid) {
        // Android için Google Navigation (yol tarifi)
        const googleNavUrl = `google.navigation:q=${lat},${lng}`;
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        try {
            window.location.href = googleNavUrl;
            
            // Navigation app açılamazsa web'i aç
            setTimeout(() => {
                window.open(fallbackUrl, '_blank');
            }, 1500);
        } catch (error) {
            window.open(fallbackUrl, '_blank');
        }
        
    } else {
        // Desktop ve diğer platformlar için Google Maps web yol tarifi
        const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(webMapsUrl, '_blank');
    }
}

window.openMaps = openMaps;

if (!('scrollBehavior' in document.documentElement.style)) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js';
    script.onload = () => {
        window.__forceSmoothScrollPolyfill__ = true;
        window.smoothscroll.polyfill();
    };
    document.head.appendChild(script);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
    });
}

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.vetSim = {
        version: '2.0.0',
        config: CONFIG,
        managers: vetSimApp.managers,
        utils: Utils,
        goToSlide: (index) => heroManager.goToSlide(index),
        getPerformance: () => performanceMonitor.getMetrics(),
        toggleAutoPlay: () => {
            CONFIG.hero.autoPlay = !CONFIG.hero.autoPlay;
            if (CONFIG.hero.autoPlay) {
                heroManager.startAutoPlay();
            } else {
                heroManager.destroy();
            }
        }
    };
    
    console.log('%cDeveloper Tools Available:', 'color: #f59e0b; font-weight: bold;');
    console.log('• vetSim.goToSlide(index) - Navigate to hero slide');
    console.log('• vetSim.getPerformance() - Get performance metrics');
    console.log('• vetSim.toggleAutoPlay() - Toggle hero autoplay');
    console.log('• vetSim.config - View configuration');
}
