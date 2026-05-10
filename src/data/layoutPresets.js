/* eslint-disable */

const LAYOUT_PORTFOLIO = {
  meta: { name: 'Portfolio Hero', category: 'portfolio', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'fixedHeight', height: 720, layout: 'free',
      children: [
        { id: 'p-logo', archetype: 'text', behavior: 'fixed', x: 56, y: 28, w: 32, h: 24, z: 4,
          props: { text: 'JC', fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#ffffff' } },
        { id: 'p-nav', archetype: 'text', behavior: 'fixed', x: 380, y: 32, w: 520, h: 16, z: 4,
          props: { text: 'ABOUT       SERVICES       PORTFOLIO       TESTIMONIALS', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', letterSpacing: '0.18em', color: '#ffffff', textAlign: 'center' } },
        { id: 'p-cta', archetype: 'button', behavior: 'fixed', x: 1136, y: 22, w: 96, h: 32, z: 4,
          props: { label: 'CONTACT', variant: 'primary', radius: 4, paddingX: 12, paddingY: 8 } },
        { id: 'p-bg', archetype: 'image', behavior: 'stretch', x: 0, y: 0, w: 1280, h: 720, z: 0, props: { objectPosition: 'center 30%' } },
        { id: 'p-portrait', archetype: 'image', behavior: 'scaleProportionally', x: 460, y: 80, w: 360, h: 440, z: 1, props: { objectPosition: 'center 30%' } },
        { id: 'p-name', archetype: 'text', behavior: 'wrap', x: 64, y: 460, w: 1152, h: 200, z: 2,
          props: { text: 'Kaely Liora', fontFamily: 'Inter', fontSize: 200, fontWeight: '500', lineHeight: '1', letterSpacing: '-0.045em', color: '#ffffff', textAlign: 'center' } }
      ]
    },
    {
      behavior: 'auto', height: 380, layout: 'free',
      children: [
        { id: 'p-a-eyebrow', archetype: 'text', behavior: 'wrap', x: 64, y: 96, w: 240, h: 16,
          props: { text: 'ABOUT', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', letterSpacing: '0.18em', color: '#71717A' } },
        { id: 'p-a-body', archetype: 'text', behavior: 'wrap', x: 440, y: 96, w: 552, h: 120,
          props: { text: "Hi, I'm Kaelis, a freelance designer with a passion for clean UI, user-centric thinking, and thoughtful branding. With over 10 years of experience, I help startups and businesses turn ideas into meaningful visual stories.",
            fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.75', color: '#0f172a' } }
      ]
    }
  ]
};

const LAYOUT_MARKETING = {
  meta: { name: 'SaaS Landing', category: 'marketing', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'fixedHeight', height: 96, layout: 'free',
      children: [
        { id: 'm-logo', archetype: 'text', behavior: 'fixed', x: 64, y: 36, w: 120, h: 22,
          props: { text: '∞ Wunder', fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#0f172a' } },
        { id: 'm-nav', archetype: 'text', behavior: 'fixed', x: 540, y: 38, w: 540, h: 18,
          props: { text: 'Solutions   ·   How it Works   ·   Resources   ·   Company', fontFamily: 'Inter', fontSize: 13, fontWeight: '400', color: '#0f172a', textAlign: 'center' } },
        { id: 'm-cta', archetype: 'button', behavior: 'fixed', x: 1136, y: 28, w: 100, h: 36,
          props: { label: 'Get Started', variant: 'primary', radius: 6, paddingX: 14, paddingY: 8 } }
      ]
    },
    {
      behavior: 'auto', height: 320, layout: 'free',
      children: [
        { id: 'm-headline', archetype: 'text', behavior: 'wrap', x: 64, y: 80, w: 500, h: 160,
          props: { text: "Real estate's most trusted energy partner", fontFamily: 'Inter', fontSize: 48, fontWeight: '400', lineHeight: '1.1', letterSpacing: '-0.01em', color: '#0f172a' } },
        { id: 'm-copy', archetype: 'text', behavior: 'wrap', x: 640, y: 96, w: 480, h: 60,
          props: { text: 'Seamlessly deploy solar, battery storage, and EV chargers across your portfolio.', fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: '1.6', color: '#3F3F46' } },
        { id: 'm-link', archetype: 'text', behavior: 'wrap', x: 640, y: 180, w: 240, h: 24,
          props: { text: '→  Explore Our Solutions', fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#0f172a' } }
      ]
    },
    {
      behavior: 'fixedHeight', height: 480, layout: 'free',
      children: [
        { id: 'm-hero-img', archetype: 'image', behavior: 'stretch', x: 0, y: 0, w: 1280, h: 480, props: { objectPosition: 'center' } }
      ]
    },
    {
      behavior: 'auto', height: 400, layout: 'free',
      children: [
        { id: 'm-f-eyebrow', archetype: 'text', behavior: 'wrap', x: 64, y: 88, w: 200, h: 16,
          props: { text: 'WHY CHOOSE US', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', letterSpacing: '0.18em', color: '#71717A' } },
        { id: 'm-f-h', archetype: 'text', behavior: 'wrap', x: 64, y: 128, w: 360, h: 120,
          props: { text: 'Get more value out of your properties', fontFamily: 'Inter', fontSize: 36, fontWeight: '400', lineHeight: '1.15', color: '#0f172a' } },
        { id: 'm-feat-1', archetype: 'text', behavior: 'wrap', x: 640, y: 88, w: 520, h: 28,
          props: { text: 'Trusted experts', fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#0f172a' } },
        { id: 'm-feat-1-b', archetype: 'text', behavior: 'wrap', x: 640, y: 124, w: 520, h: 60,
          props: { text: "We understand energy isn't your primary business. As your advocate and consultant, we'll help you craft and execute an energy strategy.",
            fontFamily: 'Inter', fontSize: 13, fontWeight: '400', lineHeight: '1.65', color: '#3F3F46' } },
        { id: 'm-feat-2', archetype: 'text', behavior: 'wrap', x: 640, y: 212, w: 520, h: 28,
          props: { text: 'Long-term vision', fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#0f172a' } },
        { id: 'm-feat-2-b', archetype: 'text', behavior: 'wrap', x: 640, y: 248, w: 520, h: 60,
          props: { text: 'Long-lasting infrastructure demands a long-term partner. We provide full-service life-cycle solutions.',
            fontFamily: 'Inter', fontSize: 13, fontWeight: '400', lineHeight: '1.65', color: '#3F3F46' } }
      ]
    }
  ]
};

const LAYOUT_EDITORIAL = {
  meta: { name: 'Magazine', category: 'editorial', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'fixedHeight', height: 80, layout: 'free',
      children: [
        { id: 'e-logo', archetype: 'text', behavior: 'fixed', x: 64, y: 32, w: 100, h: 18,
          props: { text: 'Laurits®', fontFamily: 'Inter', fontSize: 16, fontWeight: '400', color: '#0f172a' } },
        { id: 'e-nav', archetype: 'text', behavior: 'fixed', x: 800, y: 34, w: 380, h: 16,
          props: { text: 'HOMES   PAGES   PORTFOLIO   SHOP   BLOG', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', letterSpacing: '0.04em', color: '#0f172a', textAlign: 'right' } }
      ]
    },
    {
      behavior: 'fixedHeight', height: 200, layout: 'free',
      children: [
        { id: 'e-display', archetype: 'text', behavior: 'wrap', x: 0, y: 24, w: 1280, h: 160, z: 1,
          props: { text: 'MAGAZINE', fontFamily: 'Inter', fontSize: 200, fontWeight: '500', lineHeight: '0.92', letterSpacing: '-0.04em', color: '#0f172a', textAlign: 'center' } }
      ]
    },
    {
      behavior: 'auto', height: 400, layout: 'free',
      children: [
        { id: 'e-f1-img', archetype: 'image', behavior: 'stretch', x: 64, y: 16, w: 520, h: 320, props: { objectPosition: 'center' } },
        { id: 'e-f1-date', archetype: 'text', behavior: 'wrap', x: 64, y: 350, w: 200, h: 14,
          props: { text: '◻︎  June 16, 2021', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', color: '#71717A' } },
        { id: 'e-f1-title', archetype: 'text', behavior: 'wrap', x: 64, y: 370, w: 480, h: 56,
          props: { text: 'Our picks from the 1st Design Festival', fontFamily: 'Inter', fontSize: 22, fontWeight: '400', lineHeight: '1.2', color: '#0f172a' } },
        { id: 'e-f2-img', archetype: 'image', behavior: 'stretch', x: 640, y: 16, w: 560, h: 140, props: { objectPosition: 'center' } },
        { id: 'e-f2-title', archetype: 'text', behavior: 'wrap', x: 640, y: 168, w: 360, h: 36,
          props: { text: 'Explore a different range of styles', fontFamily: 'Inter', fontSize: 18, fontWeight: '400', lineHeight: '1.2', color: '#0f172a' } },
        { id: 'e-f3-img', archetype: 'image', behavior: 'stretch', x: 640, y: 220, w: 560, h: 100, props: { objectPosition: 'center' } },
        { id: 'e-f3-title', archetype: 'text', behavior: 'wrap', x: 640, y: 332, w: 360, h: 36,
          props: { text: 'The hand-crafted objects just for you', fontFamily: 'Inter', fontSize: 18, fontWeight: '400', lineHeight: '1.2', color: '#0f172a' } }
      ]
    }
  ]
};

const LAYOUT_STUDIO = {
  meta: { name: 'Brand Studio', category: 'portfolio', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'fixedHeight', height: 96, layout: 'free',
      children: [
        { id: 's-meta-l', archetype: 'text', behavior: 'fixed', x: 64, y: 24, w: 220, h: 32,
          props: { text: 'Alphamark™\n©2023 All rights reserved', fontFamily: 'Inter', fontSize: 10, fontWeight: '400', lineHeight: '1.4', color: '#0f172a' } },
        { id: 's-meta-r', archetype: 'text', behavior: 'fixed', x: 980, y: 24, w: 240, h: 32,
          props: { text: 'Skopje · North Macedonia\n41° 59′ 47.26″ N', fontFamily: 'Inter', fontSize: 10, fontWeight: '400', lineHeight: '1.4', color: '#0f172a', textAlign: 'right' } }
      ]
    },
    {
      behavior: 'fixedHeight', height: 160, layout: 'free',
      children: [
        { id: 's-mark', archetype: 'text', behavior: 'wrap', x: 0, y: 0, w: 1280, h: 160,
          props: { text: 'Alphamark™', fontFamily: 'Inter', fontSize: 200, fontWeight: '500', lineHeight: '0.96', letterSpacing: '-0.04em', color: '#0f172a', textAlign: 'center' } }
      ]
    },
    {
      behavior: 'auto', height: 160, layout: 'free',
      children: [
        { id: 's-tag', archetype: 'text', behavior: 'wrap', x: 64, y: 32, w: 1152, h: 96,
          props: { text: 'Your creative partner for brand and identity transformation.', fontFamily: 'Inter', fontSize: 36, fontWeight: '400', lineHeight: '1.2', letterSpacing: '-0.01em', color: '#0f172a' } }
      ]
    },
    {
      behavior: 'fixedHeight', height: 320, layout: 'free',
      children: [
        { id: 's-p1-img', archetype: 'image', behavior: 'stretch', x: 32, y: 16, w: 588, h: 280, props: { objectPosition: 'center' } },
        { id: 's-p1-h', archetype: 'text', behavior: 'wrap', x: 32, y: 300, w: 360, h: 18,
          props: { text: '→  Nestvested  ·  Visual communication strategy', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', color: '#0f172a' } },
        { id: 's-p2-img', archetype: 'image', behavior: 'stretch', x: 660, y: 16, w: 588, h: 280, props: { objectPosition: 'center' } },
        { id: 's-p2-h', archetype: 'text', behavior: 'wrap', x: 660, y: 300, w: 360, h: 18,
          props: { text: 'Sysfacts AG', fontFamily: 'Inter', fontSize: 11, fontWeight: '400', color: '#0f172a' } }
      ]
    },
    {
      behavior: 'auto', height: 220, layout: 'free',
      children: [
        { id: 's-statement', archetype: 'text', behavior: 'wrap', x: 64, y: 48, w: 1152, h: 140,
          props: { text: 'At Alphamark, we specialise in building cutting-edge identity systems to help professional service providers increase their value and gain a competitive advantage.',
            fontFamily: 'Inter', fontSize: 32, fontWeight: '400', lineHeight: '1.25', letterSpacing: '-0.005em', color: '#0f172a' } }
      ]
    }
  ]
};

const LAYOUT_SCATTERED = {
  meta: { name: 'Scattered Discovery', category: 'editorial', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'fixedHeight', height: 720, layout: 'free',
      children: [
        { id: 'tile-tl', archetype: 'image', behavior: 'scaleProportionally', x: 48, y: -40, w: 424, h: 200, z: 0,
          props: { gradient: 'linear-gradient(135deg, #d4d6f5 0%, #e8e8f0 50%, #eeece0 100%)' } },
        { id: 'tile-tr', archetype: 'image', behavior: 'scaleProportionally', x: 940, y: -16, w: 252, h: 200, z: 0,
          props: { gradient: 'radial-gradient(circle at 50% 60%, #f4f0e2 0%, #e2e3f0 55%, #c7cbf0 100%)' } },
        { id: 'tile-bl', archetype: 'image', behavior: 'scaleProportionally', x: -64, y: 320, w: 188, h: 220, z: 0,
          props: { gradient: 'radial-gradient(circle at 50% 50%, #f6f2e4 0%, #e3e4f0 55%, #cdd0f0 100%)' } },
        { id: 'tile-bc', archetype: 'image', behavior: 'scaleProportionally', x: 180, y: 460, w: 350, h: 280, z: 0,
          props: { gradient: 'radial-gradient(ellipse at 50% 80%, #ffffff 0%, #e8e8f3 35%, #cfd2f0 75%, #c7cbf0 100%)' } },
        { id: 'tile-br', archetype: 'image', behavior: 'scaleProportionally', x: 880, y: 416, w: 256, h: 220, z: 0,
          props: { gradient: 'radial-gradient(ellipse at 50% 60%, #f4efe1 0%, #dadcf0 55%, #c8cbf0 100%)' } },
        { id: 'cta-explore', archetype: 'button', behavior: 'fixed', x: 600, y: 388, w: 96, h: 28, z: 2,
          props: { label: 'Explore', variant: 'ghost', radius: 0, paddingX: 4, paddingY: 4 } }
      ]
    }
  ]
};

const LAYOUT_SPHERE = {
  meta: { name: 'Sphere & Statement', category: 'marketing', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'auto', height: 640, layout: 'free',
      children: [
        { id: 'sphere-block', archetype: 'image', behavior: 'scaleProportionally', x: 80, y: 32, w: 644, h: 580, z: 0,
          props: { gradient: 'radial-gradient(circle at 50% 50%, #f5f1e2 0%, #dde0f5 50%, #c8ccf2 85%, #c8ccf2 100%)' } },
        { id: 'statement-card', archetype: 'container', behavior: 'wrap', x: 660, y: 144, w: 528, h: 332, z: 1,
          props: { background: '#F4F4F5', borderColor: 'transparent', borderRadius: 0 } },
        { id: 'card-title', archetype: 'text', behavior: 'wrap', parent: 'statement-card', x: 56, y: 56, w: 416, h: 50,
          props: { text: 'Write a Title Here', fontFamily: 'Inter', fontSize: 36, fontWeight: '500', lineHeight: '1.1', letterSpacing: '-0.01em', color: '#0f172a', textAlign: 'left' } },
        { id: 'card-body', archetype: 'text', behavior: 'wrap', parent: 'statement-card', anchor: 'card-title', x: 56, y: 24, w: 416, h: 132,
          props: { text: 'Use this space to promote the business, its products or its services. Help people become familiar with the business and its offerings, creating a sense of connection and trust.', fontFamily: 'Inter', fontSize: 15, fontWeight: '400', lineHeight: '1.55', color: '#3F3F46', textAlign: 'left' } },
        { id: 'card-cta', archetype: 'button', behavior: 'fixed', parent: 'statement-card', anchor: 'card-body', x: 56, y: 32, w: 96, h: 36,
          props: { label: 'Explore', variant: 'primary', radius: 999, paddingX: 22, paddingY: 10 } }
      ]
    }
  ]
};

const LAYOUT_BLEED_ARCH = {
  meta: { name: 'Bleed Arch', category: 'editorial', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'auto', height: 360, layout: 'free',
      children: [
        { id: 'arch-bg', archetype: 'image', behavior: 'scaleProportionally', x: 0, y: 0, w: 1280, h: 360, z: 0,
          props: { gradient: 'radial-gradient(ellipse 90% 120% at 50% 110%, #ffffff 0%, #e6e7ec 35%, #d6d9ef 70%, #d4d7ef 100%)' } },
        { id: 'eyebrow-title', archetype: 'text', behavior: 'scaleProportionally', x: 268, y: 64, w: 280, h: 90, z: 2,
          props: { text: 'Write a\nTitle here', fontFamily: 'Inter', fontSize: 32, fontWeight: '500', lineHeight: '1.15', letterSpacing: '-0.01em', color: '#0f172a', textAlign: 'left' } },
        { id: 'subtitle', archetype: 'text', behavior: 'wrap', x: 580, y: 76, w: 564, h: 24, z: 2,
          props: { text: 'A Subtitle Goes Here', fontFamily: 'Inter', fontSize: 16, fontWeight: '500', lineHeight: '1.4', color: '#0f172a', textAlign: 'left' } },
        { id: 'body-copy', archetype: 'text', behavior: 'wrap', anchor: 'subtitle', x: 580, y: 24, w: 564, h: 180, z: 2,
          props: { text: 'This is a space to promote the business, its products or its services. Use this opportunity to help site visitors become more familiar with the business and its offerings.', fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.6', color: '#0f172a', textAlign: 'left' } }
      ]
    }
  ]
};

const LAYOUT_DISC_HERO = {
  meta: { name: 'Centered Disc Hero', category: 'marketing', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'auto', height: 580, layout: 'free',
      children: [
        { id: 'hero-band', archetype: 'container', behavior: 'wrap', x: 80, y: 32, w: 1120, h: 516,
          props: { background: 'linear-gradient(180deg, #dbdef0 0%, #e9eaee 55%, #ececea 100%)', borderColor: 'transparent', borderRadius: 0 } },
        { id: 'hero-disc', archetype: 'image', behavior: 'scaleProportionally', parent: 'hero-band', x: 380, y: 88, w: 360, h: 360, z: 0,
          props: { gradient: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f4f3ee 60%, #e6e7e4 100%)' } },
        { id: 'hero-title', archetype: 'text', behavior: 'scaleProportionally', parent: 'hero-band', x: 100, y: 144, w: 920, h: 88, z: 2,
          props: { text: 'Write a Title Here', fontFamily: 'Inter', fontSize: 64, fontWeight: '500', lineHeight: '1.05', letterSpacing: '-0.02em', color: '#0f172a', textAlign: 'center' } },
        { id: 'hero-sub', archetype: 'text', behavior: 'wrap', parent: 'hero-band', anchor: 'hero-title', x: 240, y: 32, w: 800, h: 80, z: 2,
          props: { text: 'Use this space to promote the business, its products or its services. Help people become familiar with the business and its offerings.', fontFamily: 'Inter', fontSize: 15, fontWeight: '400', lineHeight: '1.55', color: '#0f172a', textAlign: 'center' } },
        { id: 'hero-cta', archetype: 'button', behavior: 'fixed', parent: 'hero-band', anchor: 'hero-sub', x: 512, y: 28, w: 96, h: 36, z: 2,
          props: { label: 'Explore', variant: 'primary', radius: 999, paddingX: 22, paddingY: 10 } }
      ]
    }
  ]
};

const LAYOUT_BLANK_HERO = {
  meta: { name: 'Blank Canvas Hero', category: 'editorial', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [{
    behavior: 'auto', height: 720, layout: 'free',
    children: [
      { id: 'eyebrow', archetype: 'text', behavior: 'fixed', x: 96, y: 120, w: 200, h: 18,
        props: { text: 'INTRODUCING', fontFamily: 'Inter', fontSize: 11, fontWeight: '500', letterSpacing: '0.14em', color: '#71717A', textAlign: 'left' } },
      { id: 'title', archetype: 'text', behavior: 'wrap', anchor: 'eyebrow', x: 96, y: 24, w: 880, h: 168,
        props: { text: 'A blank canvas\nfor your next idea.', fontFamily: 'Inter', fontSize: 72, fontWeight: '500', lineHeight: '1.05', letterSpacing: '-0.02em', color: '#0f172a', textAlign: 'left' } },
      { id: 'sub', archetype: 'text', behavior: 'wrap', anchor: 'title', x: 96, y: 32, w: 640, h: 56,
        props: { text: 'Start from nothing. Compose intentionally. Ship something honest.', fontFamily: 'Inter', fontSize: 17, fontWeight: '400', lineHeight: '1.55', color: '#3F3F46', textAlign: 'left' } },
      { id: 'cta', archetype: 'button', behavior: 'fixed', anchor: 'sub', x: 96, y: 32, w: 132, h: 40,
        props: { label: 'Begin', variant: 'primary', radius: 999, paddingX: 24, paddingY: 11 } }
    ]
  }]
};

const LAYOUT_AI_DARK = {
  meta: { name: 'AI Tech Hero', category: 'marketing', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [{
    behavior: 'auto', height: 680, layout: 'free',
    children: [
      { id: 'ai-band', archetype: 'container', behavior: 'wrap', x: 80, y: 64, w: 1120, h: 552,
        props: { background: 'linear-gradient(135deg, #1a1d2e 0%, #2d3252 50%, #1f2230 100%)', borderColor: 'transparent', borderRadius: 16 } },
      { id: 'ai-glow', archetype: 'image', behavior: 'scaleProportionally', parent: 'ai-band', x: 720, y: 80, w: 360, h: 360, z: 0,
        props: { gradient: 'radial-gradient(circle at 50% 50%, #c9cdf0 0%, #6b71a8 40%, transparent 75%)' } },
      { id: 'ai-eyebrow', archetype: 'text', behavior: 'wrap', parent: 'ai-band', x: 64, y: 96, w: 200, h: 16, z: 2,
        props: { text: 'AI \u00b7 INFRASTRUCTURE', fontFamily: 'Inter', fontSize: 11, fontWeight: '500', letterSpacing: '0.18em', color: '#a8acd0' } },
      { id: 'ai-title', archetype: 'text', behavior: 'wrap', parent: 'ai-band', anchor: 'ai-eyebrow', x: 64, y: 24, w: 640, h: 192, z: 2,
        props: { text: 'Models that\nthink in your shape.', fontFamily: 'Inter', fontSize: 60, fontWeight: '500', lineHeight: '1.05', letterSpacing: '-0.02em', color: '#ffffff' } },
      { id: 'ai-body', archetype: 'text', behavior: 'wrap', parent: 'ai-band', anchor: 'ai-title', x: 64, y: 28, w: 540, h: 78, z: 2,
        props: { text: 'Inference at the edge. Training on your fleet. Pricing that reads like a phone bill, not a hostage note.', fontFamily: 'Inter', fontSize: 15, fontWeight: '400', lineHeight: '1.6', color: '#d4d6e8' } },
      { id: 'ai-cta', archetype: 'button', behavior: 'fixed', parent: 'ai-band', anchor: 'ai-body', x: 64, y: 32, w: 132, h: 40, z: 2,
        props: { label: 'See specs', variant: 'primary', radius: 999, paddingX: 24, paddingY: 11 } }
    ]
  }]
};

const LAYOUT_CARD_SPHERE = {
  meta: { name: 'Card Over Sphere', category: 'marketing', refWidth: 1280, mode: 'mesh', initialCanvasWidth: 1280 },
  sections: [
    {
      behavior: 'auto', height: 540, layout: 'free',
      children: [
        { id: 'sphere-block', archetype: 'image', behavior: 'scaleProportionally', x: 644, y: 40, w: 540, h: 480, z: 0,
          props: { gradient: 'radial-gradient(circle at 50% 60%, #f4f1e3 0%, #e1e3f0 55%, #d4d7f0 100%)' } },
        { id: 'overlap-card', archetype: 'container', behavior: 'wrap', x: 280, y: 110, w: 720, h: 322, z: 2,
          props: { background: '#F4F4F5', borderColor: 'transparent', borderRadius: 0 } },
        { id: 'card-eyebrow', archetype: 'text', behavior: 'wrap', parent: 'overlap-card', x: 80, y: 56, w: 560, h: 22,
          props: { text: 'A Subtitle Goes Here', fontFamily: 'Inter', fontSize: 15, fontWeight: '500', lineHeight: '1.4', color: '#0f172a', textAlign: 'center' } },
        { id: 'card-title', archetype: 'text', behavior: 'wrap', parent: 'overlap-card', anchor: 'card-eyebrow', x: 80, y: 14, w: 560, h: 50,
          props: { text: 'Write a Title here', fontFamily: 'Inter', fontSize: 36, fontWeight: '500', lineHeight: '1.1', letterSpacing: '-0.01em', color: '#0f172a', textAlign: 'center' } },
        { id: 'card-body', archetype: 'text', behavior: 'wrap', parent: 'overlap-card', anchor: 'card-title', x: 80, y: 22, w: 560, h: 72,
          props: { text: 'Use this space to promote the business, its products or its services. Help people become familiar with the business and its offerings.', fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.55', color: '#0f172a', textAlign: 'center' } },
        { id: 'card-cta', archetype: 'button', behavior: 'fixed', parent: 'overlap-card', anchor: 'card-body', x: 312, y: 24, w: 96, h: 36,
          props: { label: 'Explore', variant: 'primary', radius: 999, paddingX: 22, paddingY: 10 } }
      ]
    }
  ]
};

const SECTION_BLANK = {
  meta: { name: 'Blank Section', category: 'sections' },
  sections: [{ behavior: 'auto', height: 480, layout: 'free', children: [] }]
};

const SECTION_HERO_TEXT = {
  meta: { name: 'Hero Text Section', category: 'sections', refWidth: 1280 },
  sections: [{
    behavior: 'auto', height: 520, layout: 'free',
    children: [
      { id: 'sh-eyebrow', archetype: 'text', behavior: 'fixed', x: 96, y: 96, w: 200, h: 16,
        props: { text: 'YOUR BRAND', fontFamily: 'Inter', fontSize: 11, fontWeight: '500', letterSpacing: '0.14em', color: '#71717A' } },
      { id: 'sh-title', archetype: 'text', behavior: 'wrap', anchor: 'sh-eyebrow', x: 96, y: 24, w: 640, h: 120,
        props: { text: 'Make it yours.', fontFamily: 'Inter', fontSize: 64, fontWeight: '500', lineHeight: '1.05', letterSpacing: '-0.02em', color: '#0f172a' } },
      { id: 'sh-body', archetype: 'text', behavior: 'wrap', anchor: 'sh-title', x: 96, y: 24, w: 520, h: 56,
        props: { text: 'A brief description of what this section is about.', fontFamily: 'Inter', fontSize: 17, fontWeight: '400', lineHeight: '1.55', color: '#3F3F46' } },
      { id: 'sh-cta', archetype: 'button', behavior: 'fixed', anchor: 'sh-body', x: 96, y: 28, w: 120, h: 40,
        props: { label: 'Get Started', variant: 'primary', radius: 999, paddingX: 22, paddingY: 10 } }
    ]
  }]
};

const SECTION_IMAGE_SPLIT = {
  meta: { name: 'Image + Text Split', category: 'sections', refWidth: 1280 },
  sections: [{
    behavior: 'fixedHeight', height: 480, layout: 'free',
    children: [
      { id: 'si-img', archetype: 'image', behavior: 'scaleProportionally', x: 0, y: 0, w: 640, h: 480,
        props: { gradient: 'linear-gradient(135deg, #d4d7f3 0%, #ecedf0 100%)' } },
      { id: 'si-title', archetype: 'text', behavior: 'wrap', x: 720, y: 120, w: 480, h: 56,
        props: { text: 'A visual story.', fontFamily: 'Inter', fontSize: 36, fontWeight: '500', lineHeight: '1.15', color: '#0f172a' } },
      { id: 'si-body', archetype: 'text', behavior: 'wrap', anchor: 'si-title', x: 720, y: 20, w: 440, h: 80,
        props: { text: 'Pair a striking image with text to make your point. Let the visuals do half the talking.', fontFamily: 'Inter', fontSize: 15, fontWeight: '400', lineHeight: '1.6', color: '#3F3F46' } },
      { id: 'si-cta', archetype: 'button', behavior: 'fixed', anchor: 'si-body', x: 720, y: 24, w: 112, h: 38,
        props: { label: 'Learn More', variant: 'primary', radius: 999, paddingX: 22, paddingY: 10 } }
    ]
  }]
};

const SECTION_FEATURES_3COL = {
  meta: { name: '3-Column Features', category: 'sections', refWidth: 1280 },
  sections: [{
    behavior: 'auto', height: 360, layout: 'free',
    children: [
      { id: 'sf-h', archetype: 'text', behavior: 'wrap', x: 96, y: 64, w: 400, h: 48,
        props: { text: 'Why choose us', fontFamily: 'Inter', fontSize: 32, fontWeight: '500', lineHeight: '1.15', color: '#0f172a' } },
      { id: 'sf-1-t', archetype: 'text', behavior: 'wrap', x: 96, y: 148, w: 320, h: 28,
        props: { text: 'Fast delivery', fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#0f172a' } },
      { id: 'sf-1-b', archetype: 'text', behavior: 'wrap', anchor: 'sf-1-t', x: 96, y: 8, w: 320, h: 56,
        props: { text: 'Get your order delivered within 24 hours of purchase.', fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.55', color: '#3F3F46' } },
      { id: 'sf-2-t', archetype: 'text', behavior: 'wrap', x: 480, y: 148, w: 320, h: 28,
        props: { text: 'Quality guaranteed', fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#0f172a' } },
      { id: 'sf-2-b', archetype: 'text', behavior: 'wrap', anchor: 'sf-2-t', x: 480, y: 8, w: 320, h: 56,
        props: { text: 'Every product passes our rigorous quality checks.', fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.55', color: '#3F3F46' } },
      { id: 'sf-3-t', archetype: 'text', behavior: 'wrap', x: 864, y: 148, w: 320, h: 28,
        props: { text: '24/7 support', fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#0f172a' } },
      { id: 'sf-3-b', archetype: 'text', behavior: 'wrap', anchor: 'sf-3-t', x: 864, y: 8, w: 320, h: 56,
        props: { text: 'Our team is always available to help you out.', fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.55', color: '#3F3F46' } }
    ]
  }]
};

export const LAYOUT_PRESETS = [
  { id: 'portfolio-hero', name: 'Portfolio Hero', description: 'Full-screen hero with large name overlay', category: 'portfolio', spec: LAYOUT_PORTFOLIO },
  { id: 'saas-landing', name: 'SaaS Landing', description: 'Marketing page with feature highlights', category: 'marketing', spec: LAYOUT_MARKETING },
  { id: 'magazine', name: 'Magazine', description: 'Editorial layout with featured articles', category: 'editorial', spec: LAYOUT_EDITORIAL },
  { id: 'brand-studio', name: 'Brand Studio', description: 'Brand identity showcase with large wordmark', category: 'portfolio', spec: LAYOUT_STUDIO },
  { id: 'scattered', name: 'Scattered Discovery', description: 'Artful image tiles scattered across canvas', category: 'editorial', spec: LAYOUT_SCATTERED },
  { id: 'sphere-statement', name: 'Sphere & Statement', description: 'Large sphere visual with overlapping card', category: 'marketing', spec: LAYOUT_SPHERE },
  { id: 'bleed-arch', name: 'Bleed Arch', description: 'Gradient arch background with body text', category: 'editorial', spec: LAYOUT_BLEED_ARCH },
  { id: 'disc-hero', name: 'Centered Disc Hero', description: 'Hero section with centered circular graphic', category: 'marketing', spec: LAYOUT_DISC_HERO },
  { id: 'blank-hero', name: 'Blank Canvas Hero', description: 'Clean hero with eyebrow, title and CTA', category: 'editorial', spec: LAYOUT_BLANK_HERO },
  { id: 'ai-dark', name: 'AI Tech Hero', description: 'Dark theme tech hero with glow effect', category: 'marketing', spec: LAYOUT_AI_DARK },
  { id: 'card-sphere', name: 'Card Over Sphere', description: 'Overlapping card on sphere background', category: 'marketing', spec: LAYOUT_CARD_SPHERE },
];

export const SECTION_PRESETS = [
  { id: 'sec-blank', name: 'Blank Section', description: 'Empty section to start fresh', category: 'sections', spec: SECTION_BLANK },
  { id: 'sec-hero-text', name: 'Hero Text', description: 'Eyebrow + headline + body + CTA', category: 'sections', spec: SECTION_HERO_TEXT },
  { id: 'sec-image-split', name: 'Image + Text Split', description: 'Side-by-side image and text', category: 'sections', spec: SECTION_IMAGE_SPLIT },
  { id: 'sec-features-3col', name: '3-Column Features', description: 'Three feature columns with descriptions', category: 'sections', spec: SECTION_FEATURES_3COL },
];
