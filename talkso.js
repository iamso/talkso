'use strict';

class Talkso {
  constructor() {
    this.html = document.documentElement;
    this.body = document.body;
    this.width = this.body.clientWidth;
    this.height = this.body.clientHeight;
    this.slides = [].slice.call(document.querySelectorAll('body > section'), 0);
    this.current = this.slides[0];
    this.steps = [].slice.call(this.current.querySelectorAll('.step'), 0);
    this.allSteps = [].slice.call(document.querySelectorAll('.step'), 0);
    this.progress = document.querySelector('.progress-bar');
    this.index = 0;
    this.step = 0;
    this.windows = [];

    this.init();
  }
  init() {
    this.resize();
    this.hashchange();
    'ontouchstart' in window && this.setupTouch();
    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('keydown', this.keydown.bind(this));
    window.addEventListener('hashchange', this.hashchange.bind(this));
    window.addEventListener('message', this.message.bind(this));
    window.addEventListener('load', e => {
      document.documentElement.classList.add('loaded');
      this.printNotes();
    });
    document.body.addEventListener('click', e => {
      if (this.html.classList.contains('overview') && e.target && e.target.nodeName === "SECTION") {
        const index = this.slides.indexOf(e.target) + 1;
        if (index === this.index) {
          this.toggleOverview();
        }
        else {
          this.html.classList.remove('overview');
          this.goto(index);
        }
      }
    }, false);

    if (/notrans/.test(location.search)) {
      document.documentElement.classList.add('no-transitions');
    }
  }
  start() {
    this.goto(1, [].slice.call(this.slides[0].querySelectorAll('.step.active'), 0).length);
  }
  end() {
    this.goto(this.slides.length, [].slice.call(this.slides[this.slides.length - 1].querySelectorAll('.step'), 0).length);
  }
  prev() {
    this.goto(this.index - 1, [].slice.call(this.slides[this.index <= 1 ? this.slides.length - 1 : this.index - 2].querySelectorAll('.step.active'), 0).length);
  }
  next() {
    if (this.step < this.steps.length && !this.html.classList.contains('overview')) {
      this.goto(this.index, this.step + 1);
    }
    else {
      this.goto(this.index + 1, [].slice.call(this.slides[this.index >= this.slides.length ? 1 : this.index].querySelectorAll('.step.active'), 0).length);
    }
  }
  goto(index = 1, step = 0) {
    index = ~~index;
    step = ~~step;
    if (index !== this.index || step !== this.step) {
      const old = this.current;

      if (this.loop) {
        if (index <= 0) {
          this.index = this.slides.length;
        }
        else if (index > this.slides.length) {
          this.index = 1;
        }
        else {
          this.index = index;
        }
      }
      else {
        this.index = Math.min(Math.max(index, 1), this.slides.length);
        if (this.index === this.slides.length) {
          this.stopAutoplay();
        }
      }

      this.current.classList.remove('active');
      this.current = this.slides[this.index - 1];
      this.current.classList.add('active');
      this.steps = [].slice.call(this.current.querySelectorAll('.step'), 0);
      if (this.steps.length) {
        this.step = Math.min(Math.max(step, 0), this.steps.length);
        if (this.step) {
          for (let i = 0; i < this.step; i++) {
            this.steps[i].classList.add('active');
          }
        }
      }
      else {
        this.step = 0;
      }

      location.hash = `${this.index}.${this.step}`;

      if (this.html.classList.contains('overview')) {
        this.current.scrollIntoView(true);
      }
      else {
        this.toggleMedia(old, false);
        this.toggleMedia(this.current, true, true);
      }

      this.setProgress();
      this.printNotes();
    }
  }
  setProgress() {
    const steps = this.steps.length + 1;
    const slideSize = 100 / (this.slides.length - 1);
    const stepSize = slideSize / steps;

    if (this.progress) {
      this.progress.style.width = `${(this.index - 1) * slideSize + this.step * stepSize}%`;
    }
  }
  startAutoplay(speed = 5000) {
    this.stopAutoplay();
    this.interval = setInterval(this.next.bind(this), +speed);
    this.autoplaying = true;
  }
  stopAutoplay() {
    clearInterval(this.interval);
    this.autoplaying = false;
  }
  toggleAutoplay(speed) {
    if (this.autoplaying) {
      this.stopAutoplay();
    }
    else {
      if (!speed) {
        speed = prompt(`autoplay speed in ms\n(hint: total duration / ${this.slides.length + this.allSteps.length})`, 5000);
      }
      speed && this.startAutoplay(speed);
    }
  }
  toggleLoop() {
    this.loop = !this.loop;
  }
  printNotes() {
    console.clear();
    this.slides.forEach((slide, i) => {
      const notes = slide.querySelector('details');
      const index = i + 1;
      const current = index === this.index;
      const group = `Slide #${index}`;

      current ? console.group(group) : console.groupCollapsed(group);
      if (notes) {
        console.log(notes.textContent);
      }
      console.groupEnd(group);
    });
  }
  toggleMedia(parent = this.current, state, restart = false) {
    [].slice.call(parent.querySelectorAll('audio, video'), 0).forEach(el => {
      if (state !== false && (el.paused || el.paused)) {
        if (restart) {
          el.currentTime = 0;
        }
        el.play();
      }
      else {
        el.pause();
      }
    });
  }
  toggleOverview() {
    this.html.classList.toggle('overview');

    if (this.html.classList.contains('overview')) {
      this.current.scrollIntoView(true);
      this.toggleMedia(this.current, false);
    }
    else{
      this.toggleMedia(this.current, true, true);
    }
  }
  help() {
    const help =
`[UP] / [LEFT] - previous slide
[DOWN] / [RIGHT] - next slide
[HOME] / [S] - go to start
[END] / [E] - go to end
[SPACE] - toggle media playback
[F] - fullscreen
[O] - toggle overview
[A] - toggle autoplay
[L] - toggle loop`;
    console.log(help);
    alert(help);
  }
  fullscreen() {
    const requestFullscreen = this.html.requestFullscreen || this.html.requestFullScreen || this.html.mozRequestFullScreen || this.html.webkitRequestFullScreen;
    if (requestFullscreen) {
      requestFullscreen.apply(this.html);
    }
  }
  setupTouch() {
    const threshold = 100;
    const restraint = 100;
    const allowedTime = 300;
    let startX;
    let startY;
    let distX;
    let distY;
    let elapsedTime;
    let startTime;

    window.addEventListener('touchstart', e => {
      distX = 0;
      distY = 0;
      startX = e.changedTouches[0].pageX
      startY = e.changedTouches[0].pageY
      startTime = Date.now();
    }, false);

    window.addEventListener('touchmove', e => {
      if (!this.html.classList.contains('overview')) {
        e.preventDefault();
        return false;
      }
    }, {passive: false});

    window.addEventListener('touchend', e => {
      distX = e.changedTouches[0].pageX - startX;
      distY = e.changedTouches[0].pageY - startY;
      elapsedTime = Date.now() - startTime;
      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          if (distX < 0) {
            this.next();
          }
          else {
            this.prev();
          }
        }
      }
    }, false);

    window.addEventListener('gestureend', e => {
      const overview = this.html.classList.contains('overview');
      if (e.scale < 1.0) {
        if (!overview) {
          this.toggleOverview();
        }
      }
      else if (e.scale > 1.0) {
        if (overview) {
          this.toggleOverview();
        }
      }
    }, false);
  }
  resize(e) {
    const factorX = this.width / window.innerWidth;
    const factorY = this.height / window.innerHeight;
    this.body.style.transform = `scale(${1 / Math.max(factorX, factorY)})`;
  }
  keydown(e) {
    const key = e.key;

    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(key)) {
      e.preventDefault();
      this.prev();
    }
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(key)) {
      e.preventDefault();
      this.next();
    }
    if (['Home', 's'].includes(key)) {
      e.preventDefault();
      this.start();
    }
    if (['End', 'e'].includes(key)) {
      e.preventDefault();
      this.end();
    }
    if (key === ' ') {
      e.preventDefault();
      this.toggleMedia();
    }
    if (key === 'f') {
      e.preventDefault();
      this.fullscreen();
    }
    if (key === 'o') {
      e.preventDefault();
      this.toggleOverview();
    }
    if (key === 'a') {
      e.preventDefault();
      this.toggleAutoplay();
    }
    if (key === 'l') {
      e.preventDefault();
      this.toggleLoop();
    }
    if (key === 'h') {
      e.preventDefault();
      this.help();
    }
  }
  hashchange(e) {
    const hash = location.hash.replace('#', '');
    let [id, step] = hash.split('.');
    id = ~~id || 1;
    step = ~~step;
    if (step > [].slice.call(this.slides[id - 1].querySelectorAll('.step'), 0).length) {
      step = 0;
      id++;
    }
    this.goto(id, step);
  }
  message(e) {
    const win = e.source;
    const data = e.data;
    const response = {};
    for (let key of Object.keys(data)) {
      const value = data[key];
      switch(key) {
        case 'start':
          this.start();
          break;
        case 'end':
          this.end();
          break;
        case 'prev':
          this.prev();
          break;
        case 'next':
          this.next();
          break;
        case 'toggle':
          this.toggle(value);
          break;
        case 'goto':
          const [id, step] = value.split('.');
          this.goto(id, step);
          response.position = `${this.index}.${this.step}`;
          break;
        case 'length':
          response.length = this.slides.length;
          break;
        case 'position':
          response.position = `${this.index}.${this.step}`;
          break;
        case 'notes':
          response.notes = this.current.querySelector('details').textContent();
          break;
        case 'title':
          response.title = document.title;
          break;
      }
    }
    win.postMessage(response, '*');
  }
}

window.talkso = new Talkso();
