'use strict';

const embeds = [].slice.call(document.querySelectorAll('[data-talkso-embed]'), 0);

for (let embed of embeds) {
  const id = embed.dataset.talksoEmbed;
  const parent = embed.parentNode;
  const wrapper = document.createElement('div');
  const iframe = document.createElement('iframe');
  wrapper.style.position = 'relative';
  wrapper.style.paddingBottom = 'calc(62.5% + 42px)';
  iframe.frameBorder = 0;
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 0;
  iframe.src = `embed.html#${id}`;
  wrapper.appendChild(iframe);
  parent.replaceChild(wrapper, embed);
}
