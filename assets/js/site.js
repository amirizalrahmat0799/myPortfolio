// Portfolio interactions: galaxy starfield, mobile nav, active section, scroll reveal.
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  // ---------- Starfield ----------
  // Three depth layers of twinkling stars with gentle scroll/mouse parallax and the
  // occasional shooting star. Pauses when the tab is hidden; draws one still frame
  // when the visitor prefers reduced motion.
  (function starfield() {
    var canvas = document.querySelector('.starfield');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    var LAYERS = [
      { density: 0.00016, size: [0.4, 0.9], speed: 0.02, parallax: 0.02 },
      { density: 0.00005, size: [0.8, 1.4], speed: 0.05, parallax: 0.05 },
      { density: 0.000015, size: [1.3, 2.1], speed: 0.1, parallax: 0.1 }
    ];
    var TINTS = ['255,255,255', '214,220,255', '190,235,255', '255,220,245'];

    var w = 0, h = 0, dpr = 1, stars = [], meteors = [];
    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    var running = false, rafId = 0, last = 0, nextMeteor = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = [];
      var area = w * h;
      LAYERS.forEach(function (layer, depth) {
        var count = Math.round(area * layer.density);
        for (var i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: rand(layer.size[0], layer.size[1]),
            depth: depth,
            base: rand(0.35, 0.95),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.6, 1.8),
            tint: TINTS[Math.floor(Math.random() * TINTS.length)]
          });
        }
      });
      if (!running) draw(0, 0);
    }

    function spawnMeteor(now) {
      var fromLeft = Math.random() < 0.5;
      var angle = rand(0.35, 0.6); // radians below horizontal
      var speed = rand(0.7, 1.1);   // px per ms
      meteors.push({
        x: fromLeft ? rand(0, w * 0.6) : rand(w * 0.4, w),
        y: rand(-20, h * 0.35),
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: rand(900, 1400)
      });
      nextMeteor = now + rand(4000, 9000);
    }

    function draw(time, dt) {
      ctx.clearRect(0, 0, w, h);

      // ease parallax toward the target
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      var scroll = window.scrollY || 0;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var layer = LAYERS[s.depth];
        if (dt) {
          s.y -= layer.speed * dt * 0.01; // slow upward drift
          if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
        }
        var px = s.x + mouseX * layer.parallax * 40;
        var py = (s.y - scroll * layer.parallax) % h;
        if (py < 0) py += h;
        if (px < 0) px += w; else if (px > w) px -= w;

        var a = s.base * (0.65 + 0.35 * Math.sin(time * 0.001 * s.twinkle + s.phase));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + s.tint + ',' + a.toFixed(3) + ')';
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.depth === 2) { // soft halo on the nearest stars
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + s.tint + ',' + (a * 0.12).toFixed(3) + ')';
          ctx.arc(px, py, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // shooting stars
      for (var j = meteors.length - 1; j >= 0; j--) {
        var m = meteors[j];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        var p = m.life / m.ttl;
        if (p >= 1) { meteors.splice(j, 1); continue; }
        var alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        var tail = 110;
        var len = Math.hypot(m.vx, m.vy) || 1;
        var tx = m.x - (m.vx / len) * tail;
        var ty = m.y - (m.vy / len) * tail;
        var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
        g.addColorStop(0.3, 'rgba(165,150,255,' + alpha * 0.6 + ')');
        g.addColorStop(1, 'rgba(94,231,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      if (now > nextMeteor) spawnMeteor(now);
      draw(now, dt);
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion.matches || document.hidden) return;
      running = true;
      last = 0;
      nextMeteor = performance.now() + rand(1500, 4000);
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    window.addEventListener('pointermove', function (e) {
      targetX = (e.clientX / w - 0.5) * 2;
      targetY = (e.clientY / h - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('scroll', function () {
      if (!running) draw(0, 0); // keep the still frame in sync with scroll parallax
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    var onMotionChange = function () {
      if (reduceMotion.matches) { stop(); meteors = []; draw(0, 0); } else start();
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);

    resize();
    start();
  })();

  // ---------- Mobile nav ----------
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');

  function closeNav() {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  // ---------- Header border on scroll ----------
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Active nav link ----------
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('active'); });
        var link = byId[entry.target.id];
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach(function (s) { sectionObserver.observe(s); });

    // ---------- Reveal on scroll ----------
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  // ---------- Footer year ----------
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
