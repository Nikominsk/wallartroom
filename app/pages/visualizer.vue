<template>
  <section>

    <header class="site-header">
    <div class="container nav">
      
      <a class="brand" href="#">Wall<span style="color: #c5a059">Art</span>Room</a>
      <nav class="nav-links">
        <a href="#visualizer">Visualizer</a>
        <a href="#journal">Journal</a>
        <!-- <a href="#newsletter">Newsletter</a> -->
      </nav>
    </div>
  </header>

  <main>
    <section class="hero" id="showcase">
      <div class="container hero-grid">
        <div>
          <span class="eyebrow">Immersive Art Experience</span>
          <h1>Visualize <span style="color: #c5a059"><em>at scale</em></span><br>within your sanctuary.</h1>
          <p>Our curatorial technology bridges the gap between digital discovery and physical reality. Witness how your masterpieces live on your walls before the first stroke is printed.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#visualizer">Enter Visualizer
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </div>

        <div class="hero-art-shell">
          <div class="hero-art">
            <div class="frame">
              <div class="art-image">
                <img src="@@/assets/images/showcase.png" alt="Showcase"/>
              </div>
            </div>
            <div class="scan-badge">
              <div class="mini">✦</div>
              <div>
                <strong style="display:block;color:#3a342d">Scanning Active</strong>
                <span>Zooming / 17%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- <section class="section" id="collections">
      <div class="container">
        <div class="center-header">
          <div class="eyebrow">Curator's Choice</div>
          <h2>Trending Artifacts</h2>
          <div class="divider"></div>
        </div>

        <div class="artifacts-grid">
          <article class="artifact">
            <div class="thumb thumb-1"></div>
            <h3>Evanescent Drift <span class="price">$240</span></h3>
            <small>AI Collection — Series 04</small>
          </article>
          <article class="artifact">
            <div class="thumb thumb-2"></div>
            <h3>Topographic Silence <span class="price">$195</span></h3>
            <small>AI Collection — Series 02</small>
          </article>
          <article class="artifact">
            <div class="thumb thumb-3"></div>
            <h3>Fluid Convergence <span class="price">$310</span></h3>
            <small>AI Collection — Series 09</small>
          </article>
          <article class="artifact">
            <div class="thumb thumb-4"></div>
            <h3>Zenith Monolith <span class="price">$180</span></h3>
            <small>AI Collection — Series 01</small>
          </article>
        </div>

        <div style="text-align:center">
          <a class="archive-link" href="#journal">View Complete Archive
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
    </section> -->

    <section class="quote-section" id="journal">
      <div class="container quote-wrap">
        <div class="quote-star">✦</div>
        <blockquote>"Art is not just a visual filler; it is the atmospheric anchor of a home. We believe the future of curation lies in the fusion of human intent and digital precision."</blockquote>
        <div class="quote-source">— The WallArtRoom</div>
      </div>
    </section>

    <section class="section visualizer-section" id="visualizer">
      <div class="container">
        <div class="visualizer-layout">
          <div class="visualizer-content">
            <span class="eyebrow">Wall Preview Experience</span>
            <h2>See your art in the room before you commit</h2>
            <p>
              The visualizer lets customers place artwork into their own interior
              and instantly understand scale, mood, and composition. Instead of
              guessing from a product page, they get a realistic preview of how a
              piece works with their wall, furniture, and lighting.
            </p>
          </div>

          <div class="visualizer-preview">
            <div class="preview-frame">
              <img src="@@/assets/images/image.png" alt="WallArtRoom visualizer preview" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- <section class="newsletter section" id="newsletter">
      <div class="container newsletter-card">
        <div>
          <div class="eyebrow">Collector's Letter</div>
          <h2>Join the newsletter for new drops, curated interiors, and digital exhibition notes.</h2>
          <p>Receive thoughtful updates from The Digital Curator with exclusive previews, editorial selections, and early access to upcoming artifact releases.</p>
        </div>
        <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Thank you for subscribing to The Digital Curator newsletter.');">
          <input type="email" placeholder="Your email address" aria-label="Your email address" required>
          <button class="btn btn-primary" type="submit">Subscribe</button>
        </form>
      </div>
    </section> -->
  </main>

  <footer>
    <div class="container footer-grid">
      <div class="tmp-grid">
        <div class="w50">
          <div class="footer-brand">WallArtRoom</div>
          <div class="footer-copy footer-left">
            Refining the digital art landscape through sophisticated curation and architectural visualization.
          </div>
        </div>
        <div class="footer-copy">© 2026 The WallArtRoom. All rights reserved. Crafted for the modern collector.</div>
      </div>
      <!-- <div class="footer-col">
        <h4>Services</h4>
        <a href="#">Print Services</a>
        <a href="#">Digital Ownership</a>
        <a href="#">Curatorial Vision</a>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <a href="#">Shipping &amp; Returns</a>
        <a href="#">Privacy</a>
      </div> -->
    </div>
  </footer>

  </section>
</template>

<script>
</script>


<style lang="scss">

:root{
      --primary:#c5a059;
      --secondary:#2d2926;
      --tertiary:#8fa5d6;
      --neutral:#f5f2ed;
      --neutral-2:#ece7df;
      --text:#2d2926;
      --muted:#7d7367;
      --white:#ffffff;
      --border:#d8d0c5;
      --shadow:0 18px 40px rgba(45,41,38,.10);
      --radius:26px;
      --container:min(1180px, calc(100vw - 40px));
    }

    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{
      margin:0;
      font-family:"Manrope", system-ui, sans-serif;
      color:var(--text);
      background:var(--neutral);
      line-height:1.5;
    }
    img{max-width:100%;display:block}
    a{text-decoration:none;color:inherit}
    button,input{font:inherit}

    .container{width:var(--container);margin:0 auto}
    .serif{font-family:"Noto Serif", Georgia, serif}
    .eyebrow{
      letter-spacing:.28em;
      text-transform:uppercase;
      font-size:.68rem;
      color:#9a8c77;
    }
    .section{padding:84px 0}

    .site-header{
      position:sticky;
      top:0;
      z-index:20;
      backdrop-filter:blur(12px);
      background:rgba(245,242,237,.82);
      border-bottom:1px solid rgba(216,208,197,.7);
    }
    .nav{
      min-height:78px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:20px;
    }
    .brand{
      font-family:"Noto Serif", Georgia, serif;
      font-size:1.45rem;
      white-space:nowrap;
    }
    .nav-links{
      display:flex;
      gap:28px;
      color:var(--muted);
      font-size:.95rem;
    }
    .nav-right{
      display:flex;
      align-items:center;
      gap:14px;
    }
    .search{
      display:flex;
      align-items:center;
      gap:10px;
      padding:12px 14px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.35);
      min-width:220px;
      border-radius:14px;
      color:#9a8c77;
      font-size:.92rem;
    }
    .icon-btn{
      width:38px;height:38px;border-radius:12px;border:1px solid var(--border);
      display:grid;place-items:center;background:rgba(255,255,255,.4);color:var(--secondary)
    }

    .hero{
      padding:56px 0 70px;
      background:linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,0));
    }
    .hero-grid{
      display:grid;
      grid-template-columns:1.06fr .94fr;
      gap:48px;
      align-items:center;
    }
    .hero h1{
      margin:.25em 0 .28em;
      font-family:"Noto Serif", Georgia, serif;
      font-size:clamp(3rem, 6vw, 5.8rem);
      line-height:.95;
      font-weight:500;
      letter-spacing:-.03em;
    }
    .hero h1 em{font-style:italic;font-weight:400}
    .hero p{
      max-width:560px;
      font-size:1.05rem;
      color:var(--muted);
      margin:0 0 34px;
    }
    .actions{display:flex;gap:14px;flex-wrap:wrap}
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      min-height:54px;
      padding:0 24px;
      border-radius:14px;
      border:1px solid transparent;
      font-weight:600;
      transition:.25s ease;
    }
    .btn-primary{background:var(--primary);color:#fff;box-shadow:0 10px 24px rgba(140,108,37,.18)}
    .btn-primary:hover{transform:translateY(-1px)}
    .btn-secondary{border-color:var(--border);background:rgba(255,255,255,.45);color:var(--secondary)}

.hero-art {
  background:#ecece9;
  border-radius:12px;
  padding:28px;
  position:relative;
  min-height:520px;
  overflow:hidden;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;

  .frame {
    position:absolute;
    top:28px;
    right:28px;
    bottom:28px;
    left:28px;
    background:#fff;
    box-shadow:0 16px 28px rgba(0,0,0,.12);
    padding:14px;
    display:flex;
  }

  .art-image {
    width: 100%;
    height: 100%;
  }

  .frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    object-position: center 5px;
  }
}


    .scan-badge{
      position:absolute;
      left:33px;bottom:34px;
      display:flex;align-items:center;gap:10px;
      background:rgba(255,255,255,.9);
      border:1px solid var(--border);
      padding:10px 12px;
      border-radius:7px;
      box-shadow:0 10px 18px rgba(45,41,38,.08);
      font-size:.72rem;
      color:var(--muted);
    }
    .scan-badge .mini{
      width:24px;height:24px;border-radius:8px;background:var(--primary);display:grid;place-items:center;color:#fff;font-weight:700
    }

    .section-title{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:32px}
    .section-title h2{
      margin:.18em 0 .1em;
      font-family:"Noto Serif", Georgia, serif;
      font-size:clamp(2rem, 4vw, 3.4rem);
      line-height:1;
      font-weight:500;
    }
    .section-title p{max-width:620px;color:var(--muted);margin:0}

    .curated-grid{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:28px;
      align-items:start;
    }

    .center-header{text-align:center;margin-bottom:40px}
    .center-header h2{
      margin:.18em 0 .12em;
      font-family:"Noto Serif", Georgia, serif;
      font-size:clamp(2.1rem,4vw,3.5rem);
      font-weight:500;
    }
    .divider{width:58px;height:1px;background:#d8d0c5;margin:16px auto 0}

    .artifacts-grid{
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:22px;
    }
    .artifact{
      background:rgba(255,255,255,.35);
      border:1px solid rgba(216,208,197,.7);
      padding:16px;
      border-radius:20px;
      transition:.25s ease;
    }
    .artifact:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
    .thumb{aspect-ratio:1/1.12;background:#ddd;border-radius:10px;margin-bottom:12px;overflow:hidden;position:relative}
    .thumb-1{background:radial-gradient(circle at 54% 66%, #686868 0 13px, transparent 14px), linear-gradient(180deg,#989898 0%, #6c6c6c 100%)}
    .thumb-1::before{content:"";position:absolute;left:40%;top:18%;width:20%;height:48%;border:2px solid rgba(255,255,255,.4);border-radius:50% 50% 60% 60%/38% 38% 62% 62%;transform:rotate(18deg)}
    .thumb-2{background:radial-gradient(circle at 50% 52%, #f1f1f1 0 18%, transparent 19%), linear-gradient(180deg,#111 0%, #2a2a2a 100%)}
    .thumb-2::before{content:"";position:absolute;left:22%;top:14%;width:56%;height:66%;border-radius:50% 44% 50% 46%/38% 56% 44% 54%;border:18px solid rgba(255,255,255,.65)}
    .thumb-3{background:linear-gradient(180deg,#6c6c6c 0%, #2c2c2c 100%)}
    .thumb-3::before{content:"";position:absolute;left:28%;top:20%;width:44%;height:52%;border-radius:48% 48% 40% 40%/34% 34% 56% 56%;background:linear-gradient(180deg,#d9d9d9,#8a8a8a)}
    .thumb-3::after{content:"";position:absolute;left:34%;bottom:16%;width:32%;height:18%;border-radius:50%;background:rgba(255,255,255,.24)}
    .thumb-4{background:repeating-linear-gradient(90deg,#c6c4c0 0 1px,#b8b5b0 1px 6px)}
    .artifact h3{margin:0 0 4px;font-family:"Noto Serif", serif;font-size:1.1rem;font-weight:500}
    .artifact small{display:block;color:#9a8c77;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem}
    .price{float:right;color:#9a8c77;font-weight:600;font-size:.92rem}
    .archive-link{display:inline-flex;gap:10px;align-items:center;margin-top:34px;color:#5e564b;letter-spacing:.24em;text-transform:uppercase;font-size:.72rem}

    .quote-section{background:#ded8d0;padding:110px 0}
    .quote-wrap{max-width:100%;margin:0 auto;text-align:center;padding: 0 5px;}
    .quote-star{color:#c8a96a;font-size:1.5rem;margin-bottom:18px}
    blockquote{
      margin:0 auto 26px;
      font-family:"Noto Serif", Georgia, serif;
      font-style:italic;
      font-size:clamp(1.7rem, 3.2vw, 3rem);
      line-height:1.12;
      letter-spacing:-.02em;
      max-width:860px;
    }
    .quote-source{font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;color:#6d655b}


.visualizer-section {
  .visualizer-layout {
    display: flex;
    align-items: center;
    gap: 48px;
    overflow: hidden;
  }

  .visualizer-content {
    flex: 0 0 30%;
    max-width: 40%;

    .eyebrow {
      display: inline-block;
      margin-bottom: 14px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 12px;
      color: #9a8c77;
    }

    h2 {
      margin: 0 0 18px;
      font-size: clamp(32px, 4vw, 52px);
      line-height: 1.05;
    }

    p {
      margin: 0 0 16px;
      font-size: 17px;
      line-height: 1.7;
      color: #555;
      max-width: 560px;
    }
  }

  .visualizer-preview {
    // flex: 0 0 60%;
    // max-width: 60%;
  }

  .preview-frame {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    // background: #f6f3ee;
    // box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
    // box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }
  }

  @media (max-width: 992px) {
    .visualizer-layout {
      gap: 32px;
    }

    .visualizer-content,
    .visualizer-preview {
      flex-basis: 50%;
      max-width: 50%;
    }

    .visualizer-content p {
      font-size: 16px;
    }
  }

  @media (max-width: 768px) {
    .visualizer-layout {
      flex-direction: column;
      align-items: stretch;
    }

    .visualizer-content,
    .visualizer-preview {
      flex: 1 1 100%;
      max-width: 100%;
    }

    .visualizer-content {
      order: 1;
    }

    .visualizer-preview {
      order: 2;
    }

    .preview-frame {
      border-radius: 18px;
    }
  }
}


    .newsletter{
      background:linear-gradient(180deg, #f8f5f1 0%, #f2ece4 100%);
      border-top:1px solid rgba(216,208,197,.8);
      border-bottom:1px solid rgba(216,208,197,.8);
    }
    .newsletter-card{
      display:grid;
      grid-template-columns:1.05fr .95fr;
      gap:28px;
      align-items:center;
      padding:44px 0;
    }
    .newsletter-card h2{margin:.18em 0 .16em;font-family:"Noto Serif", serif;font-size:clamp(2rem,3.6vw,3.2rem);font-weight:500;line-height:1.02}
    .newsletter-card p{margin:0;color:var(--muted);max-width:560px}
    .newsletter-form{
      display:flex;
      gap:12px;
      background:rgba(255,255,255,.72);
      border:1px solid var(--border);
      padding:12px;
      border-radius:20px;
      box-shadow:var(--shadow);
    }
    .newsletter-form input{
      flex:1;border:none;outline:none;background:transparent;padding:8px 10px;color:var(--secondary)
    }

    footer{padding:34px 0 50px}
    .footer-grid{
      display:grid;grid-template-columns:1.4fr .9fr .9fr;gap:30px;align-items:start;


      .tmp-grid {
        display: flex; grid-column: 1/4;
        .w50 {
          width: 50%;

          .footer-left {
            margin-top:0;max-width:360px;text-transform:none;letter-spacing:.05em;line-height:1.7
          }

        }
      }
    }
    .footer-brand{font-family:"Noto Serif", serif;font-style:italic;margin-bottom:18px}
    .footer-col h4{margin:0 0 14px;color:#9a8c77;text-transform:uppercase;letter-spacing:.2em;font-size:.7rem}
    .footer-col a,.footer-copy{color:#6f665b;font-size:.88rem}
    .footer-col{display:flex;flex-direction:column;gap:10px}
    .footer-copy{margin-top:28px;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase}

    .mobile-nav-toggle{display:none}

    @media (max-width: 980px){
      .nav{flex-wrap:wrap;padding:16px 0}
      .nav-links{order:3;width:100%;justify-content:center;flex-wrap:wrap;gap:18px}
      .hero-grid,.newsletter-card,.footer-grid{grid-template-columns:1fr}
      .hero-art-shell{max-width:700px;margin:0 auto}
      .curated-grid{grid-template-columns:1fr 1fr}
      .artifacts-grid{grid-template-columns:repeat(2,1fr)}
    }

    @media (max-width: 640px){
      :root{--container:min(100vw - 28px, 100vw - 28px)}
      .site-header{position:static}
      .nav{min-height:auto;padding:14px 0;gap:12px}
      .brand{font-size:1.2rem}
      .nav-links{justify-content:flex-start;font-size:.88rem;gap:12px 16px}
      .search{min-width:0;flex:1}
      .nav-right{width:100%}
      .hero{padding:32px 0 46px}
      .hero h1{font-size:clamp(2.55rem, 13vw, 4rem)}
      .hero p{font-size:.97rem}
      .actions{flex-direction:column;align-items:stretch}
      .btn{width:100%}
      .hero-art-shell{padding:16px;border-radius:24px}
      .hero-art{min-height:360px;padding:16px}
      .hero-art {
        min-height: 260px;
        padding: 16px;
      }

      .hero-art .frame {
        top: 16px;
        right: 16px;
        bottom: 16px;
        left: 16px;
        padding: 10px;

        img {
          object-position: center -25px;
        }
      }
      .hero-grid,.newsletter-card,.footer-grid{grid-template-columns:1fr}
      .hero-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      .hero {
        padding: 40px 0 50px;
      }

      .hero-grid > div:first-child {
        text-align: center;
      }

      .hero p {
        margin-left: auto;
        margin-right: auto;
      }

      .actions {
        justify-content: center;
      }

      .hero-art-shell {
        width: 100%;
      }
      .scan-badge{left:16px;bottom:16px;padding:8px 10px}
      .section{padding:58px 0}
      .section-title{flex-direction:column;align-items:flex-start}
      .curated-grid,.artifacts-grid{grid-template-columns:1fr}
      .category-art{height:300px}
      blockquote{font-size:1.9rem}
      .newsletter-form{flex-direction:column}
      .footer-grid{.tmp-grid{flex-direction: column;  .w50 {width: 100%;}}}
    }
</style>