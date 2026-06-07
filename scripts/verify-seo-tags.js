import fetch from 'node-fetch';

const LIVE_URL = 'https://cameraman-pro-2aa2b.web.app';

async function runAudit() {
  console.log('Starting Live SEO Audit...\n');

  // 1. Verify robots.txt
  console.log('1. Checking robots.txt...');
  try {
    const res = await fetch(`${LIVE_URL}/robots.txt`);
    if (res.status === 200) {
      const text = await res.text();
      console.log('   [SUCCESS] robots.txt exists.');
      if (text.includes('Sitemap:')) {
        console.log('   [SUCCESS] robots.txt references sitemap.');
      } else {
        console.log('   [WARNING] robots.txt is missing sitemap reference.');
      }
    } else {
      console.log(`   [FAIL] robots.txt returned status: ${res.status}`);
    }
  } catch (e) {
    console.log('   [FAIL] Failed to fetch robots.txt:', e.message);
  }

  // 2. Verify sitemap.xml
  console.log('\n2. Checking sitemap.xml...');
  try {
    const res = await fetch(`${LIVE_URL}/sitemap.xml`);
    if (res.status === 200) {
      const text = await res.text();
      console.log('   [SUCCESS] sitemap.xml exists.');
      if (text.includes('<urlset') && text.includes('<loc>')) {
        console.log('   [SUCCESS] sitemap.xml is valid XML format and lists URLs.');
      } else {
        console.log('   [WARNING] sitemap.xml structure might be invalid.');
      }
    } else {
      console.log(`   [FAIL] sitemap.xml returned status: ${res.status}`);
    }
  } catch (e) {
    console.log('   [FAIL] Failed to fetch sitemap.xml:', e.message);
  }

  // 3. Verify Google site verification file
  console.log('\n3. Checking Google Search Console verification file...');
  try {
    const res = await fetch(`${LIVE_URL}/googlee089201991823.html`);
    if (res.status === 200) {
      const text = await res.text();
      if (text.includes('google-site-verification')) {
        console.log('   [SUCCESS] HTML verification file is valid and live.');
      } else {
        console.log('   [WARNING] HTML verification file exists but content is wrong.');
      }
    } else {
      console.log(`   [FAIL] HTML verification file returned status: ${res.status}`);
    }
  } catch (e) {
    console.log('   [FAIL] Failed to fetch verification file:', e.message);
  }

  // 4. Verify Homepage tags
  console.log('\n4. Checking Homepage HTML Tags...');
  try {
    const res = await fetch(LIVE_URL);
    if (res.status === 200) {
      const html = await res.text();
      
      const checks = {
        title: /<title>([^<]+)<\/title>/.exec(html)?.[1],
        description: /<meta name="description" content="([^"]+)"/.exec(html)?.[1],
        keywords: /<meta name="keywords" content="([^"]+)"/.exec(html)?.[1],
        siteVerification: /<meta name="google-site-verification" content="([^"]+)"/.exec(html)?.[1],
        canonical: /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1],
        ogTitle: /<meta property="og:title" content="([^"]+)"/.exec(html)?.[1],
        ogDescription: /<meta property="og:description" content="([^"]+)"/.exec(html)?.[1],
        ogUrl: /<meta property="og:url" content="([^"]+)"/.exec(html)?.[1],
        ogImage: /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1],
        twitterCard: /<meta name="twitter:card" content="([^"]+)"/.exec(html)?.[1],
        structuredData: html.includes('type="application/ld+json"'),
      };

      console.log('   - Title:', checks.title ? `[OK] "${checks.title}"` : '[MISSING]');
      console.log('   - Description:', checks.description ? `[OK] "${checks.description.slice(0, 50)}..."` : '[MISSING]');
      console.log('   - Keywords:', checks.keywords ? '[OK]' : '[MISSING]');
      console.log('   - Google Verification Meta:', checks.siteVerification ? `[OK] "${checks.siteVerification}"` : '[MISSING]');
      console.log('   - Canonical Link:', checks.canonical ? `[OK] "${checks.canonical}"` : '[MISSING]');
      console.log('   - OG Title:', checks.ogTitle ? '[OK]' : '[MISSING]');
      console.log('   - OG Description:', checks.ogDescription ? '[OK]' : '[MISSING]');
      console.log('   - OG Url:', checks.ogUrl ? `[OK] "${checks.ogUrl}"` : '[MISSING]');
      console.log('   - OG Image:', checks.ogImage ? `[OK] "${checks.ogImage}"` : '[MISSING]');
      console.log('   - Twitter Card:', checks.twitterCard ? `[OK] "${checks.twitterCard}"` : '[MISSING]');
      console.log('   - Structured Data (JSON-LD):', checks.structuredData ? '[OK] Found' : '[MISSING]');
    } else {
      console.log(`   [FAIL] Homepage returned status: ${res.status}`);
    }
  } catch (e) {
    console.log('   [FAIL] Failed to fetch homepage HTML:', e.message);
  }

  console.log('\nAudit complete!');
}

runAudit();
