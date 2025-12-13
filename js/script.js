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
        if (!el) return false;
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
        productsManager.init();
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
        this.activeSection = this.getCurrentSection();
    }

    init() {
        if (!this.nav) return;
        
        this.bindEvents();
        this.updateActiveLink();
    }

    getCurrentSection() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        if (page.includes('Anasayfa') || page === '' || page === '/') {
            return 'hero';
        } else if (page.includes('Urunler')) {
            return 'products';
        } else if (page.includes('Iletisim')) {
            return 'contact';
        }
        return 'hero';
    }

    bindEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                if (href.includes('.html')) {
                    return;
                } else if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetElement = document.querySelector(href);
                    
                    if (targetElement) {
                        this.scrollToElement(targetElement);
                        this.setActiveLink(link);
                    }
                }
            });
        });

        const scrollHandler = Utils.throttle(() => {
            this.handleScroll();
        }, CONFIG.scroll.debounce);

        window.addEventListener('scroll', scrollHandler, { passive: true });

        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    handleScroll() {
        if (!this.nav) return;
        
        const scrollTop = window.pageYOffset;
        const shouldBeScrolled = scrollTop > CONFIG.scroll.threshold;

        if (shouldBeScrolled !== this.isScrolled) {
            this.isScrolled = shouldBeScrolled;
            this.nav.classList.toggle('scrolled', this.isScrolled);
        }

        if (document.querySelector('#hero')) {
            this.updateActiveSection();
        }
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
            let isActive = false;
            
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            
            if (href.includes('Anasayfa') && (currentPage.includes('Anasayfa') || currentPage === '' || currentPage === 'index.html')) {
                isActive = true;
            } else if (href.includes('Urunler') && currentPage.includes('Urunler')) {
                isActive = true;
            } else if (href.includes('Iletisim') && currentPage.includes('Iletisim')) {
                isActive = true;
            } else if (href.startsWith('#') && href === `#${this.activeSection}`) {
                isActive = true;
            }
            
            link.classList.toggle('active', isActive);
        });
    }

    setActiveLink(clickedLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');
    }

    scrollToElement(element) {
        if (!element || !this.nav) return;
        
        const navHeight = this.nav.offsetHeight;
        const elementTop = element.offsetTop - navHeight;
        
        window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
        });
    }

    toggleMobileMenu() {
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
        if (!this.heroSection || this.slides.length === 0) return;

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

        if (this.heroSection) {
            this.heroSection.addEventListener('mouseenter', () => {
                this.pauseAutoPlay();
            });

            this.heroSection.addEventListener('mouseleave', () => {
                this.resumeAutoPlay();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (Utils.isElementInViewport(this.heroSection, 200)) {
                if (e.key === 'ArrowLeft') {
                    this.previousSlide();
                } else if (e.key === 'ArrowRight') {
                    this.nextSlide();
                }
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
        if (!this.heroSection) return;
        
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
        if (this.slides.length === 0) return;
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        if (this.slides.length === 0) return;
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide || this.slides.length === 0) return;

        this.isTransitioning = true;
        
        this.slides[this.currentSlide].classList.remove('active');
        this.slides[index].classList.add('active');

        this.indicators[this.currentSlide]?.classList.remove('active');
        this.indicators[index]?.classList.add('active');

        this.currentSlide = index;

        setTimeout(() => {
            this.isTransitioning = false;
        }, CONFIG.hero.transition);

        this.restartAutoPlay();
    }

    startAutoPlay() {
        if (!CONFIG.hero.autoPlay || this.slides.length === 0) return;
        
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

        const firstStatParent = this.statNumbers[0]?.parentElement?.parentElement;
        if (firstStatParent) {
            observer.observe(firstStatParent);
        }
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
        return number.toString();
    }
}

class ProductsManager {
    constructor() {
        this.productsContainer = document.querySelector('.products-slider-container');
        this.productsSlider = document.querySelector('.products-slider');
        this.slides = document.querySelectorAll('.products-slide');
        this.prevButton = document.getElementById('productsPrev');
        this.nextButton = document.getElementById('productsNext');
        
        this.currentSlide = 0;
        this.isTransitioning = false;
        this.autoPlayInterval = null;
        this.isPaused = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchThreshold = 50;
        this.autoPlayDuration = 5000;
    }

    init() {
        if (!this.productsContainer || this.slides.length === 0) return;

        this.bindEvents();
        this.startAutoPlay();
        this.setupIntersectionObserver();
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

        if (this.productsContainer) {
            this.productsContainer.addEventListener('mouseenter', () => {
                this.pauseAutoPlay();
            });

            this.productsContainer.addEventListener('mouseleave', () => {
                this.resumeAutoPlay();
            });
        }

        this.addTouchSupport();

        document.addEventListener('keydown', (e) => {
            if (Utils.isElementInViewport(this.productsContainer, 200)) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.previousSlide();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextSlide();
                }
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else {
                this.resumeAutoPlay();
            }
        });
    }

    addTouchSupport() {
        if (!this.productsContainer) return;
        
        this.productsContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.pauseAutoPlay();
        }, { passive: true });

        this.productsContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            const diffX = this.touchStartX - this.touchEndX;

            if (Math.abs(diffX) > this.touchThreshold) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }

            setTimeout(() => {
                this.resumeAutoPlay();
            }, 2000);
        }, { passive: true });
    }

    setupIntersectionObserver() {
        if (!this.productsContainer) return;
        
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

        observer.observe(this.productsContainer);
    }

    nextSlide() {
        if (this.slides.length === 0) return;
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        if (this.slides.length === 0) return;
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide || !this.productsSlider) return;

        this.isTransitioning = true;
        this.currentSlide = index;
        
        const translateX = -index * 100;
        this.productsSlider.style.transform = `translateX(${translateX}%)`;
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);

        this.restartAutoPlay();
    }

    startAutoPlay() {
        if (this.slides.length === 0) return;
        
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
            
            if (!this.isScrolling) {
                this.dynamicScrollButton.style.transform = 'scale(1)';
            }
        }
    }

    startVisibilityWatcher() {
        this.visibilityInterval = setInterval(() => {
            if (this.dynamicScrollButton) {
                const computedStyle = window.getComputedStyle(this.dynamicScrollButton);
                const opacity = parseFloat(computedStyle.opacity);
                const visibility = computedStyle.visibility;
                
                if (opacity < 1 || visibility === 'hidden') {
                    this.showButton();
                }
            }
        }, 100);
    }

    bindEvents() {
        const scrollHandler = Utils.throttle(() => {
            this.handleScroll();
        }, 8);

        window.addEventListener('scroll', scrollHandler, { passive: true });

        if (this.dynamicScrollButton) {
            this.dynamicScrollButton.addEventListener('click', () => {
                this.handleDynamicScroll();
            });
        }

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

        this.showButton();
        this.updateDynamicScrollButton(scrollTop);
        this.showButton();
    }

    updateDynamicScrollButton(scrollTop) {
        if (!this.dynamicScrollButton) return;

        let shouldBeScrollUp = false;
        
        if (this.heroSection && this.aboutSection) {
            const aboutTop = this.aboutSection.offsetTop;
            shouldBeScrollUp = scrollTop >= (aboutTop - window.innerHeight / 3);
        } else {
            const scrollThreshold = window.innerHeight / 2;
            shouldBeScrollUp = scrollTop >= scrollThreshold;
        }

        if (shouldBeScrollUp !== this.isScrollUp) {
            this.isScrollUp = shouldBeScrollUp;
            this.isScrolling = true;
            
            this.showButton();
            
            this.dynamicScrollButton.style.transform = 'scale(0.8)';
            this.dynamicScrollButton.style.opacity = '1';
            this.dynamicScrollButton.style.visibility = 'visible';
            
            setTimeout(() => {
                this.dynamicScrollButton.classList.toggle('scroll-up', this.isScrollUp);
                this.dynamicScrollButton.style.transform = 'scale(1)';
                this.dynamicScrollButton.style.opacity = '1';
                this.dynamicScrollButton.style.visibility = 'visible';
                this.isScrolling = false;
                
                setTimeout(() => {
                    this.showButton();
                }, 50);
            }, 150);
        }
    }

    handleDynamicScroll() {
        const navHeight = document.getElementById('premiumNav')?.offsetHeight || 80;
        this.isScrolling = true;

        this.showButton();

        const maintainVisibility = setInterval(() => {
            this.showButton();
        }, 50);

        if (this.isScrollUp) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            if (this.aboutSection) {
                const aboutTop = this.aboutSection.offsetTop - navHeight;
                window.scrollTo({
                    top: aboutTop,
                    behavior: 'smooth'
                });
            } else {
                const currentScroll = window.pageYOffset;
                const targetScroll = currentScroll + window.innerHeight;
                window.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        }

        let lastScrollTop = window.pageYOffset;
        let scrollCheckCount = 0;
        const maxChecks = 50;

        const checkScrollComplete = () => {
            const currentScrollTop = window.pageYOffset;
            
            if (Math.abs(currentScrollTop - lastScrollTop) < 1 || scrollCheckCount >= maxChecks) {
                clearInterval(maintainVisibility);
                this.isScrolling = false;
                this.showButton();
                
                setTimeout(() => {
                    this.showButton();
                    this.handleScroll();
                }, 100);
                
                return;
            }
            
            lastScrollTop = currentScrollTop;
            scrollCheckCount++;
            this.showButton();
            
            setTimeout(checkScrollComplete, 50);
        };

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
        const serviceCards = document.querySelectorAll('.service-card, .featured-service, .product-card');
        
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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
            
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                const emergencyButton = document.querySelector('a[href*="tel:"]');
                emergencyButton?.click();
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

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

const directManager = new DirectManager();
const navigationManager = new NavigationManager();
const heroManager = new HeroManager();
const statsManager = new StatsManager();
const productsManager = new ProductsManager();
const scrollManager = new ScrollManager();
const interactionManager = new InteractionManager();

class TekAlcipanApp {
    constructor() {
        this.isInitialized = false;
        this.managers = {
            direct: directManager,
            navigation: navigationManager,
            hero: heroManager,
            stats: statsManager,
            products: productsManager,
            scroll: scrollManager,
            interaction: interactionManager
        };
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.managers.direct.init();
        this.setupErrorHandling();
        this.showConsoleGreeting();
    }

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Tek Alçıpan Error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Tek Alçıpan Unhandled Promise Rejection:', e.reason);
        });
    }

    showConsoleGreeting() {
        const styles = [
            'color: #1e3a8a',
            'font-size: 20px',
            'font-weight: bold',
            'text-shadow: 2px 2px 4px rgba(0,0,0,0.3)'
        ].join(';');

        console.log('%c🏗️ Tek Alçıpan Profil Sistemleri', styles);
        console.log('%cWebsite loaded successfully! Industrial design activated.', 'color: #0ea5e9; font-size: 14px;');
        console.log('%c🔧 Dünyayı Profilliyoruz...', 'color: #f59e0b; font-size: 12px; font-style: italic;');
    }

    destroy() {
        Object.values(this.managers).forEach(manager => {
            if (typeof manager.destroy === 'function') {
                manager.destroy();
            }
        });
        this.isInitialized = false;
    }
}

const tekAlcipanApp = new TekAlcipanApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tekAlcipanApp.init();
    });
} else {
    tekAlcipanApp.init();
}

window.TekAlcipanApp = tekAlcipanApp;

function openMaps() {
    const address = "Şekerpınar Mahallesi Fevzi Çakmak caddesi no:11 Çayırova, Kocaeli";
    const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Şekerpınar+Mahallesi+Fevzi+Çakmak+caddesi+no:11+Çayırova+kocaeli";
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(address)}`;
        window.location.href = appleMapsUrl;
        
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
        }, 1500);
        
    } else if (isAndroid) {
        const googleNavUrl = `google.navigation:q=${encodeURIComponent(address)}`;
        
        try {
            window.location.href = googleNavUrl;
            
            setTimeout(() => {
                window.open(googleMapsUrl, '_blank');
            }, 1500);
        } catch (error) {
            window.open(googleMapsUrl, '_blank');
        }
        
    } else {
        window.open(googleMapsUrl, '_blank');
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

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.tekAlcipan = {
        version: '1.0.0',
        config: CONFIG,
        managers: tekAlcipanApp.managers,
        utils: Utils,
        goToSlide: (index) => heroManager.goToSlide(index),
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
    console.log('• tekAlcipan.goToSlide(index) - Navigate to hero slide');
    console.log('• tekAlcipan.toggleAutoPlay() - Toggle hero autoplay');
    console.log('• tekAlcipan.config - View configuration');
}
