'use strict';

class Talkso {
  constructor() {
    this.html = document.documentElement;
    this.body = document.body;
    this.width = this.body.clientWidth;
    this.height = this.body.clientHeight;
    this.slides = [].slice.call(document.querySelectorAll('body > section'), 0);
    this.current = this.slides[0];
    this.steps = this.current.querySelectorAll('.step');
    this.progress = document.querySelector('.progress-bar');
    this.index = 0;
    this.step = 0;
    this.windows = []
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
  }
  start() {
    this.goto(1, this.slides[0].querySelectorAll('.step.active').length);
  }
  end() {
    this.goto(this.slides.length, this.slides[this.slides.length - 1].querySelectorAll('.step').length);
  }
  prev() {
    if (this.index > 1) {
      this.goto(this.index - 1, this.slides[this.index - 2].querySelectorAll('.step.active').length);
    }
  }
  next() {
    if (this.index <= this.slides.length && this.step <= this.steps.length) {
      if (this.step < this.steps.length && !this.html.classList.contains('overview')) {
        this.goto(this.index, this.step + 1);
      }
      else if (this.index < this.slides.length) {
        this.goto(this.index + 1, this.slides[this.index].querySelectorAll('.step.active').length);
      }
    }

  }
  goto(index = 1, step = 0) {
    index = ~~index;
    step = ~~step;
    if (index !== this.index || step !== this.step) {
      const old = this.current;
      this.index = Math.min(Math.max(index, 1), this.slides.length);
      this.current.classList.remove('active');
      this.current = this.slides[this.index - 1];
      this.current.classList.add('active');
      this.steps = this.current.querySelectorAll('.step');
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

      const notes = this.current.querySelector('details');

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
  }
  resize(e) {
    const factorX = this.width / window.innerWidth;
    const factorY = this.height / window.innerHeight;
    this.body.style.transform = `scale(${1 / Math.max(factorX, factorY)})`;
  }
  keydown(e) {
    const key = e.keyCode;

    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }
    if (key === 37 || key === 38 || key === 33) { // left, up, page up
      e.preventDefault();
      this.prev();
    }
    if (key === 39 || key === 40 || key === 34) { // right, down, page down
      e.preventDefault();
      this.next();
    }
    if (key === 35) { // end
      e.preventDefault();
      this.end();
    }
    if (key === 36) { // home
      e.preventDefault();
      this.start();
    }
    if (key === 32) { // space
      e.preventDefault();
      this.toggleMedia();
    }
    if (key === 70) { // f
      e.preventDefault();
      this.fullscreen();
    }
    if (key === 79) { // o
      e.preventDefault();
      this.toggleOverview();
    }
  }
  hashchange(e) {
    const hash = location.hash.replace('#', '');
    let [id, step] = hash.split('.');
    id = ~~id || 1;
    step = ~~step;
    if (step > this.slides[id - 1].querySelectorAll('.step').length) {
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
