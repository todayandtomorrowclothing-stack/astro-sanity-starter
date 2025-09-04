/**
 * Today & Tomorrow Website - Advanced JavaScript Implementation
 * Comprehensive website functionality with security features and animations
 * Author: AI Assistant
 * Version: 1.0.0
 */

// Security Configuration
const SecurityConfig = {
  maxFormSubmissions: 5,
  submissionTimeWindow: 300000, // 5 minutes
  maxInputLength: 1000,
  allowedDomains: ['todayandtomorrow.com', 'localhost'],
  csrfTokenLength: 32,
  sessionTimeout: 1800000, // 30 minutes
};

// Application State Management
class AppState {
  constructor() {
    this.currentSection = 'home';
    this.isMenuOpen = false;
    this.formSubmissions = [];
    this.sessionStartTime = Date.now();
    this.csrfToken = this.generateCSRFToken();
    this.userInteractions = [];
    this.scrollPosition = 0;
    this.isScrolling = false;
    this.animationQueue = [];
    this.observers = new Map();
  }

  generateCSRFToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < SecurityConfig.csrfTokenLength; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  updateCurrentSection(section) {
    this.currentSection = section;
    this.logUserInteraction('section_change', { section });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.logUserInteraction('menu_toggle', { isOpen: this.isMenuOpen });
  }

  logUserInteraction(action, data = {}) {
    this.userInteractions.push({
      timestamp: Date.now(),
      action,
      data,
      sessionTime: Date.now() - this.sessionStartTime
    });

    // Keep only last 100 interactions for memory management
    if (this.userInteractions.length > 100) {
      this.userInteractions = this.userInteractions.slice(-100);
    }
  }

  addFormSubmission() {
    const now = Date.now();
    this.formSubmissions.push(now);
    
    // Clean old submissions outside time window
    this.formSubmissions = this.formSubmissions.filter(
      time => now - time < SecurityConfig.submissionTimeWindow
    );
  }

  canSubmitForm() {
    return this.formSubmissions.length < SecurityConfig.maxFormSubmissions;
  }

  isSessionValid() {
    return Date.now() - this.sessionStartTime < SecurityConfig.sessionTimeout;
  }
}

// Security Manager
class SecurityManager {
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, SecurityConfig.maxInputLength);
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static isValidDomain() {
    const currentDomain = window.location.hostname;
    return SecurityConfig.allowedDomains.some(domain => 
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
  }

  static detectXSS(input) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  static rateLimit(key, limit, timeWindow) {
    const now = Date.now();
    const storageKey = `rateLimit_${key}`;
    
    let attempts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    attempts = attempts.filter(time => now - time < timeWindow);
    
    if (attempts.length >= limit) {
      return false;
    }
    
    attempts.push(now);
    localStorage.setItem(storageKey, JSON.stringify(attempts));
    return true;
  }
}

// Animation Manager
class AnimationManager {
  constructor() {
    this.animations = new Map();
    this.observers = new Map();
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
        }
      });
    }, options);
  }

  observeElement(element, animationType = 'fade-in') {
    element.dataset.animation = animationType;
    this.intersectionObserver.observe(element);
  }

  animateElement(element) {
    const animationType = element.dataset.animation || 'fade-in';
    
    if (element.classList.contains('animated')) return;
    
    element.classList.add('animated', animationType);
    
    // Remove animation class after completion to allow re-animation
    setTimeout(() => {
      element.classList.remove(animationType);
    }, 600);
  }

  animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      element.textContent = Math.floor(current).toLocaleString();
    }, 16);
  }

  typeWriter(element, text, speed = 50) {
    element.textContent = '';
    let i = 0;
    
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  }

  smoothScrollTo(target, duration = 800) {
    const targetElement = typeof target === 'string' ? 
      document.querySelector(target) : target;
    
    if (!targetElement) return;

    const targetPosition = targetElement.offsetTop - 80; // Account for fixed header
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      
      window.scrollTo(0, run);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
}

// Form Validation Manager
class FormValidator {
  constructor() {
    this.rules = new Map();
    this.errors = new Map();
  }

  addRule(fieldName, validator, errorMessage) {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    this.rules.get(fieldName).push({ validator, errorMessage });
  }

  validate(formData) {
    this.errors.clear();
    let isValid = true;

    for (const [fieldName, value] of formData.entries()) {
      const fieldRules = this.rules.get(fieldName);
      if (!fieldRules) continue;

      for (const rule of fieldRules) {
        if (!rule.validator(value)) {
          this.errors.set(fieldName, rule.errorMessage);
          isValid = false;
          break;
        }
      }
    }

    return isValid;
  }

  getError(fieldName) {
    return this.errors.get(fieldName) || '';
  }

  displayErrors() {
    this.errors.forEach((error, fieldName) => {
      const errorElement = document.getElementById(`${fieldName}-error`);
      if (errorElement) {
        errorElement.textContent = error;
        errorElement.style.display = 'block';
      }
    });
  }

  clearErrors() {
    this.errors.clear();
    document.querySelectorAll('.form-error').forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });
  }
}

// Notification Manager
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = document.getElementById('notification');
  }

  show(message, type = 'info', duration = 5000) {
    const notification = {
      id: Date.now(),
      message: SecurityManager.sanitizeInput(message),
      type,
      duration
    };

    this.notifications.push(notification);
    this.render(notification);

    if (duration > 0) {
      setTimeout(() => {
        this.hide(notification.id);
      }, duration);
    }

    return notification.id;
  }

  render(notification) {
    const messageElement = this.container.querySelector('.notification-message');
    messageElement.textContent = notification.message;
    
    this.container.className = `notification show ${notification.type}`;
    
    // Add type-specific styling
    switch (notification.type) {
      case 'success':
        this.container.style.borderLeft = '4px solid #10b981';
        break;
      case 'error':
        this.container.style.borderLeft = '4px solid #ef4444';
        break;
      case 'warning':
        this.container.style.borderLeft = '4px solid #f59e0b';
        break;
      default:
        this.container.style.borderLeft = '4px solid #3b82f6';
    }
  }

  hide(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.container.classList.remove('show');
  }

  hideAll() {
    this.notifications = [];
    this.container.classList.remove('show');
  }
}

// Performance Monitor
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      domContentLoadedTime: 0,
      firstPaintTime: 0,
      firstContentfulPaintTime: 0,
      interactionLatency: [],
      memoryUsage: []
    };
    
    this.startTime = performance.now();
    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            this.metrics.firstPaintTime = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaintTime = entry.startTime;
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
  }

  recordInteraction(startTime, endTime, type) {
    const latency = endTime - startTime;
    this.metrics.interactionLatency.push({
      type,
      latency,
      timestamp: Date.now()
    });

    // Keep only last 50 interactions
    if (this.metrics.interactionLatency.length > 50) {
      this.metrics.interactionLatency = this.metrics.interactionLatency.slice(-50);
    }
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  generateReport() {
    const avgLatency = this.metrics.interactionLatency.length > 0 ?
      this.metrics.interactionLatency.reduce((sum, item) => sum + item.latency, 0) / 
      this.metrics.interactionLatency.length : 0;

    return {
      ...this.metrics,
      averageInteractionLatency: avgLatency,
      currentMemoryUsage: this.getMemoryUsage(),
      totalSessionTime: Date.now() - this.startTime
    };
  }
}

// Main Application Class
class TodayTomorrowApp {
  constructor() {
    this.state = new AppState();
    this.animationManager = new AnimationManager();
    this.formValidator = new FormValidator();
    this.notificationManager = new NotificationManager();
    this.performanceMonitor = new PerformanceMonitor();
    
    this.init();
  }

  init() {
    this.checkSecurity();
    this.setupEventListeners();
    this.setupFormValidation();
    this.setupAnimations();
    this.handleInitialLoad();
    this.setupPerformanceTracking();
  }

  checkSecurity() {
    if (!SecurityManager.isValidDomain()) {
      console.warn('Application running on unauthorized domain');
    }

    // Check for session validity
    if (!this.state.isSessionValid()) {
      this.handleSessionExpiry();
    }

    // Set up CSP violation reporting
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP Violation:', e.violatedDirective, e.blockedURI);
    });
  }

  setupEventListeners() {
    // Navigation
    this.setupNavigationListeners();
    
    // Form handling
    this.setupFormListeners();
    
    // Scroll handling
    this.setupScrollListeners();
    
    // Button interactions
    this.setupButtonListeners();
    
    // Keyboard navigation
    this.setupKeyboardListeners();
    
    // Window events
    this.setupWindowListeners();
  }

  setupNavigationListeners() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    navToggle?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) {
          this.navigateToSection(section);
          this.closeMobileMenu();
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.state.isMenuOpen && 
          !navMenu.contains(e.target) && 
          !navToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
  }

  setupFormListeners() {
    const contactForm = document.getElementById('contact-form');
    
    contactForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission(e.target);
    });

    // Real-time validation
    const formInputs = contactForm?.querySelectorAll('input, select, textarea');
    formInputs?.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
  }

  setupScrollListeners() {
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
      this.state.isScrolling = true;
      this.state.scrollPosition = window.pageYOffset;
      
      this.updateHeaderOnScroll();
      this.updateScrollToTopButton();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.state.isScrolling = false;
      }, 150);
    });

    // Scroll to top button
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    scrollToTopBtn?.addEventListener('click', () => {
      this.animationManager.smoothScrollTo(document.body);
    });
  }

  setupButtonListeners() {
    // Hero buttons
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleButtonAction(action);
      });
    });

    // Service cards
    document.querySelectorAll('.floating-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const service = e.currentTarget.dataset.service;
        if (service) {
          this.navigateToSection('services');
          setTimeout(() => {
            this.switchServiceTab(service);
          }, 500);
        }
      });
    });

    // Service tabs
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        if (tab) {
          this.switchServiceTab(tab);
        }
      });
    });

    // Notification close
    const notificationClose = document.querySelector('.notification-close');
    notificationClose?.addEventListener('click', () => {
      this.notificationManager.hideAll();
    });
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Escape key closes mobile menu and notifications
      if (e.key === 'Escape') {
        this.closeMobileMenu();
        this.notificationManager.hideAll();
      }
      
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  setupWindowListeners() {
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Page visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
  }

  setupFormValidation() {
    // Name validation
    this.formValidator.addRule('name', 
      (value) => value.trim().length >= 2 && value.trim().length <= 50,
      'Name must be between 2 and 50 characters'
    );

    // Email validation
    this.formValidator.addRule('email',
      (value) => SecurityManager.validateEmail(value),
      'Please enter a valid email address'
    );

    // Phone validation (optional)
    this.formValidator.addRule('phone',
      (value) => !value || SecurityManager.validatePhone(value),
      'Please enter a valid phone number'
    );

    // Service selection validation
    this.formValidator.addRule('service',
      (value) => value.trim().length > 0,
      'Please select a service'
    );

    // Message validation
    this.formValidator.addRule('message',
      (value) => value.trim().length >= 10 && value.trim().length <= 1000,
      'Message must be between 10 and 1000 characters'
    );

    // Privacy policy validation
    this.formValidator.addRule('privacy',
      (value) => value === 'on',
      'You must agree to the privacy policy'
    );
  }

  setupAnimations() {
    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll(
      '.section-header, .feature-item, .value-item, .contact-item, .stat-item'
    );
    
    animatedElements.forEach(element => {
      this.animationManager.observeElement(element, 'slide-up');
    });

    // Setup counter animations
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(element => {
      const target = parseInt(element.dataset.target);
      if (target) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !element.classList.contains('animated')) {
              element.classList.add('animated');
              this.animationManager.animateCounter(element, target);
            }
          });
        }, { threshold: 0.5 });
        
        observer.observe(element);
      }
    });
  }

  setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        this.performanceMonitor.metrics.pageLoadTime = perfData.loadEventEnd - perfData.fetchStart;
        this.performanceMonitor.metrics.domContentLoadedTime = perfData.domContentLoadedEventEnd - perfData.fetchStart;
      }, 0);
    });

    // Track interaction performance
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        const startTime = performance.now();
        requestAnimationFrame(() => {
          const endTime = performance.now();
          this.performanceMonitor.recordInteraction(startTime, endTime, eventType);
        });
      });
    });
  }

  handleInitialLoad() {
    // Hide loading screen
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      loadingScreen?.classList.add('hidden');
      
      setTimeout(() => {
        loadingScreen?.remove();
      }, 500);
    }, 1500);

    // Set initial active section
    this.updateActiveSection('home');
    
    // Show welcome notification
    setTimeout(() => {
      this.notificationManager.show(
        'Welcome to Today & Tomorrow! Explore our services and get in touch.',
        'info',
        4000
      );
    }, 2000);
  }

  toggleMobileMenu() {
    this.state.toggleMenu();
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    navToggle?.classList.toggle('active');
    navMenu?.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = this.state.isMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    if (this.state.isMenuOpen) {
      this.state.isMenuOpen = false;
      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');
      
      navToggle?.classList.remove('active');
      navMenu?.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  navigateToSection(sectionId) {
    const startTime = performance.now();
    
    // Update state
    this.state.updateCurrentSection(sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      // Smooth scroll to section
      this.animationManager.smoothScrollTo(targetSection);
      
      // Update navigation
      this.updateActiveNavLink(sectionId);
      
      // Track performance
      const endTime = performance.now();
      this.performanceMonitor.recordInteraction(startTime, endTime, 'navigation');
    }
  }

  updateActiveNavLink(sectionId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === sectionId) {
        link.classList.add('active');
      }
    });
  }

  updateActiveSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    targetSection?.classList.add('active');
    
    this.updateActiveNavLink(sectionId);
  }

  switchServiceTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
      if (button.dataset.tab === tabId) {
        button.classList.add('active');
      }
    });
    
    // Update service panels
    document.querySelectorAll('.service-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.classList.add('fade-in');
      
      setTimeout(() => {
        targetPanel.classList.remove('fade-in');
      }, 600);
    }
    
    this.state.logUserInteraction('service_tab_change', { tab: tabId });
  }

  handleButtonAction(action) {
    switch (action) {
      case 'explore':
        this.navigateToSection('services');
        break;
      case 'contact':
        this.navigateToSection('contact');
        break;
      default:
        console.warn('Unknown button action:', action);
    }
  }

  validateField(field) {
    const formData = new FormData();
    formData.append(field.name, field.value);
    
    // Clear previous error
    this.clearFieldError(field);
    
    // Validate single field
    const fieldRules = this.formValidator.rules.get(field.name);
    if (fieldRules) {
      for (const rule of fieldRules) {
        if (!rule.validator(field.value)) {
          this.showFieldError(field, rule.errorMessage);
          return false;
        }
      }
    }
    
    return true;
  }

  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    field.classList.remove('error');
  }

  showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    field.classList.add('error');
  }

  async handleFormSubmission(form) {
    const startTime = performance.now();
    
    try {
      // Security checks
      if (!this.state.canSubmitForm()) {
        this.notificationManager.show(
          'Too many form submissions. Please wait before trying again.',
          'error'
        );
        return;
      }

      if (!SecurityManager.rateLimit('form_submission', 3, 300000)) {
        this.notificationManager.show(
          'Rate limit exceeded. Please wait before submitting again.',
          'error'
        );
        return;
      }

      // Collect and sanitize form data
      const formData = new FormData(form);
      const sanitizedData = new FormData();
      
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          const sanitizedValue = SecurityManager.sanitizeInput(value);
          
          // Check for XSS attempts
          if (SecurityManager.detectXSS(value)) {
            this.notificationManager.show(
              'Invalid input detected. Please check your submission.',
              'error'
            );
            return;
          }
          
          sanitizedData.append(key, sanitizedValue);
        } else {
          sanitizedData.append(key, value);
        }
      }

      // Validate form
      this.formValidator.clearErrors();
      
      if (!this.formValidator.validate(sanitizedData)) {
        this.formValidator.displayErrors();
        this.notificationManager.show(
          'Please correct the errors in the form.',
          'error'
        );
        return;
      }

      // Add CSRF token
      sanitizedData.append('csrf_token', this.state.csrfToken);
      sanitizedData.append('timestamp', Date.now().toString());

      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;

      // Simulate form submission (replace with actual API call)
      await this.simulateFormSubmission(sanitizedData);

      // Success handling
      this.state.addFormSubmission();
      this.notificationManager.show(
        'Thank you for your message! We\'ll get back to you soon.',
        'success'
      );
      
      form.reset();
      this.formValidator.clearErrors();

      // Track performance
      const endTime = performance.now();
      this.performanceMonitor.recordInteraction(startTime, endTime, 'form_submission');

    } catch (error) {
      console.error('Form submission error:', error);
      this.notificationManager.show(
        'An error occurred while sending your message. Please try again.',
        'error'
      );
    } finally {
      // Reset button state
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Send Message';
        submitButton.disabled = false;
      }
    }
  }

  async simulateFormSubmission(formData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log form data (in production, send to server)
    console.log('Form submitted with data:', Object.fromEntries(formData.entries()));
    
    // Simulate random success/failure for testing
    if (Math.random() > 0.1) { // 90% success rate
      return { success: true, message: 'Form submitted successfully' };
    } else {
      throw new Error('Simulated server error');
    }
  }

  updateHeaderOnScroll() {
    const header = document.getElementById('header');
    if (this.state.scrollPosition > 100) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }

  updateScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (this.state.scrollPosition > 300) {
      scrollToTopBtn?.classList.add('visible');
    } else {
      scrollToTopBtn?.classList.remove('visible');
    }
  }

  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768 && this.state.isMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Update any size-dependent calculations
    this.state.logUserInteraction('window_resize', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  handlePageHidden() {
    // Pause animations and timers when page is hidden
    this.state.logUserInteraction('page_hidden');
  }

  handlePageVisible() {
    // Resume animations and check session validity
    if (!this.state.isSessionValid()) {
      this.handleSessionExpiry();
    }
    this.state.logUserInteraction('page_visible');
  }

  handleSessionExpiry() {
    this.notificationManager.show(
      'Your session has expired. Please refresh the page.',
      'warning',
      0 // Don't auto-hide
    );
  }

  debounce(func, wait) {
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

  cleanup() {
    // Clean up event listeners and observers
    this.animationManager.intersectionObserver?.disconnect();
    
    // Save performance data
    const perfReport = this.performanceMonitor.generateReport();
    console.log('Performance Report:', perfReport);
    
    // Clear any remaining timers
    this.notificationManager.hideAll();
  }

  // Public API methods
  getState() {
    return { ...this.state };
  }

  getPerformanceReport() {
    return this.performanceMonitor.generateReport();
  }

  showNotification(message, type = 'info', duration = 5000) {
    return this.notificationManager.show(message, type, duration);
  }

  navigateTo(section) {
    this.navigateToSection(section);
  }
}

// Error Handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Don't show error notifications for minor issues
  if (event.error && event.error.name !== 'ResizeObserver loop limit exceeded') {
    // In production, you might want to send this to an error reporting service
    console.error('Application error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Check for required browser features
  const requiredFeatures = [
    'querySelector',
    'addEventListener',
    'classList',
    'FormData',
    'Promise',
    'fetch'
  ];

  const missingFeatures = requiredFeatures.filter(feature => {
    return !(feature in window || feature in document || feature in Element.prototype);
  });

  if (missingFeatures.length > 0) {
    console.error('Missing required browser features:', missingFeatures);
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
        <h1>Browser Not Supported</h1>
        <p>This website requires a modern browser. Please update your browser or use a different one.</p>
        <p>Missing features: ${missingFeatures.join(', ')}</p>
      </div>
    `;
    return;
  }

  // Initialize the application
  try {
    window.TodayTomorrowApp = new TodayTomorrowApp();
    console.log('Today & Tomorrow application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
        <h1>Application Error</h1>
        <p>Sorry, there was an error loading the application. Please refresh the page.</p>
      </div>
    `;
  }
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TodayTomorrowApp,
    SecurityManager,
    AnimationManager,
    FormValidator,
    NotificationManager,
    PerformanceMonitor
  };
}
