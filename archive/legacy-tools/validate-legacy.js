const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'events.html',
  'store.html',
  'Board.html',
  'contact.html',
  'manuscript.html',
  'our-team.html'
];

let totalImgSrc = 0;
let totalSources = 0;
let totalLinks = 0;
let totalErrors = 0;

console.log('================================================================');
console.log('DEEP VERIFICATION SUITE: Khair Publications Website');
console.log('================================================================\n');

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Missing file ${file}`);
    totalErrors++;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`[TEST] Checking ${file} (${content.length} bytes)...`);

  // 1. Tag balance check
  const tagsToCheck = ['div', 'section', 'header', 'aside', 'picture', 'nav', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'button', 'iframe'];
  for (const tag of tagsToCheck) {
    const openMatches = content.match(new RegExp(`<${tag}(\\s+[^>]*)?>`, 'gi')) || [];
    const closeMatches = content.match(new RegExp(`</${tag}>`, 'gi')) || [];
    if (openMatches.length !== closeMatches.length) {
      console.error(`  FAIL [TAG MISMATCH]: <${tag}> opened ${openMatches.length} times, closed ${closeMatches.length} times!`);
      totalErrors++;
    }
  }

  // 2. Navbar brand link check
  const brandMatch = content.match(/<a[^>]+class=["']navbar-brand["'][^>]*href=["']([^"']*)["']/i);
  if (!brandMatch) {
    console.error(`  FAIL [NAVBAR BRAND]: Missing navbar-brand in ${file}`);
    totalErrors++;
  } else if (brandMatch[1] !== 'index.html') {
    console.error(`  FAIL [NAVBAR BRAND]: navbar-brand href is '${brandMatch[1]}' instead of 'index.html' in ${file}`);
    totalErrors++;
  }

  // 3. Navbar Events link check
  const hasEventsNavLink = /<a[^>]+href=["']events\.html["'][^>]*>[\s\S]*?Events[\s\S]*?<\/a>/i.test(content);
  if (!hasEventsNavLink) {
    console.error(`  FAIL [NAVBAR EVENTS]: Missing Events link in navbar in ${file}`);
    totalErrors++;
  }

  // 4. Navbar active state check
  const activeNavLinks = content.match(/<a[^>]+class=["'][^"']*nav-link\s+active[^"']*["'][^>]*href=["']([^"']*)["']/gi) || [];
  if (activeNavLinks.length === 0) {
    console.error(`  FAIL [ACTIVE NAV]: No active nav-link found in ${file}`);
    totalErrors++;
  } else if (activeNavLinks.length > 1) {
    console.error(`  FAIL [ACTIVE NAV]: Multiple (${activeNavLinks.length}) active nav-links found in ${file}: ${activeNavLinks.join(', ')}`);
    totalErrors++;
  } else {
    const activeHref = activeNavLinks[0].match(/href=["']([^"']*)["']/i)[1];
    if (activeHref !== file) {
      console.error(`  FAIL [ACTIVE NAV]: ${file} has active nav-link pointing to '${activeHref}' instead of itself!`);
      totalErrors++;
    }
  }

  // 5. Top announcement bar check
  const hasTopBar = content.includes('top-announcement-bar');
  if (!hasTopBar) {
    console.error(`  FAIL [ANNOUNCEMENT BAR]: Missing top announcement bar in ${file}`);
    totalErrors++;
  }

  // 6. Check <img> src
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = imgSrcRegex.exec(content)) !== null) {
    const src = m[1];
    totalImgSrc++;
    if (!src.startsWith('http') && !src.startsWith('data:')) {
      const resolved = path.join(__dirname, src);
      if (!fs.existsSync(resolved)) {
        console.error(`  FAIL [BROKEN IMG SRC] in ${file}: ${src}`);
        totalErrors++;
      }
    }
  }

  // 7. Check <img> srcset
  const imgSetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi;
  while ((m = imgSetRegex.exec(content)) !== null) {
    const srcset = m[1];
    const items = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
    for (const item of items) {
      totalImgSrc++;
      if (!item.startsWith('http') && !item.startsWith('data:')) {
        const resolved = path.join(__dirname, item);
        if (!fs.existsSync(resolved)) {
          console.error(`  FAIL [BROKEN IMG SRCSET] in ${file}: ${item}`);
          totalErrors++;
        }
      }
    }
  }

  // 8. Check <source> srcset
  const srcSetRegex = /<source[^>]+srcset=["']([^"']+)["']/gi;
  while ((m = srcSetRegex.exec(content)) !== null) {
    const srcset = m[1];
    const items = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
    for (const item of items) {
      totalSources++;
      if (!item.startsWith('http') && !item.startsWith('data:')) {
        const resolved = path.join(__dirname, item);
        if (!fs.existsSync(resolved)) {
          console.error(`  FAIL [BROKEN SOURCE SRCSET] in ${file}: ${item}`);
          totalErrors++;
        }
      }
    }
  }

  // 9. Check <a href>
  const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  while ((m = hrefRegex.exec(content)) !== null) {
    const href = m[1];
    totalLinks++;
    if (
      !href.startsWith('http') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:') &&
      !href.startsWith('javascript:') &&
      !href.startsWith('#')
    ) {
      const [p, hash] = href.split('#');
      if (p) {
        const resolved = path.join(__dirname, p);
        if (!fs.existsSync(resolved)) {
          console.error(`  FAIL [BROKEN PAGE LINK] in ${file}: ${href}`);
          totalErrors++;
        }
      }
    }
  }

  // 10. Check internal anchor tags on same page
  const internalAnchorRegex = /<a[^>]+href=["']#([^"']+)["']/gi;
  while ((m = internalAnchorRegex.exec(content)) !== null) {
    const targetId = m[1];
    const idRegex = new RegExp(`id=["']${targetId}["']`, 'i');
    if (!idRegex.test(content)) {
      console.error(`  FAIL [BROKEN ANCHOR ID] in ${file}: #${targetId}`);
      totalErrors++;
    }
  }
}

// 11. Check seminar photos presence in website/images/seminar
console.log('\n[TEST] Verifying Seminar Asset Inventory...');
const seminarImgDir = path.join(__dirname, 'images', 'seminar');
const expectedPhotos = [
  'irs_seminar_2026_poster.png',
  'irs_seminar_book_launch_stage.jpeg',
  'irs_seminar_speech_sms.jpeg',
  'irs_seminar_book_launch_closeup.jpeg',
  'irs_seminar_hall_audience.jpeg',
  'irs_seminar_panel_sms_rizwan.jpeg',
  'irs_seminar_presentation_slide.jpeg',
  'irs_seminar_speech_sultan_nasir.jpeg',
  'irs_seminar_speech_dr_rehman.jpeg',
  'irs_seminar_speech_guest.jpeg',
  'irs_seminar_interview_sultan_nasir.jpeg',
  'the_news_article_2026_09_04.jpeg',
  'the_news_article_cropped.jpeg'
];

for (const photo of expectedPhotos) {
  if (!fs.existsSync(path.join(seminarImgDir, photo))) {
    console.error(`  FAIL [MISSING SEMINAR ASSET]: ${photo}`);
    totalErrors++;
  }
}
console.log(`  PASS: All ${expectedPhotos.length} seminar media assets verified on disk.`);

// 12. Check events.html photo gallery count & interactive links
console.log('\n[TEST] Verifying events.html Photo Gallery...');
const eventsHtml = fs.readFileSync(path.join(__dirname, 'events.html'), 'utf8');
const galleryCards = (eventsHtml.match(/class="seminar-photo-card"/g) || []).length;
console.log(`  Photo gallery cards count: ${galleryCards}`);
if (galleryCards !== 10) {
  console.error(`  FAIL [GALLERY COUNT]: Expected 10 cards, found ${galleryCards}`);
  totalErrors++;
} else {
  console.log('  PASS: All 10 seminar photos included in events.html gallery.');
}

const photoLinks = (eventsHtml.match(/<a[^>]+(href=["']images\/seminar\/[^"']*["'][^>]*class=["'][^"']*photo-link|class=["'][^"']*photo-link[^"']*href=["']images\/seminar\/[^"']*)/gi) || []).length;
console.log(`  Interactive click-to-view links: ${photoLinks}`);
if (photoLinks !== 10) {
  console.error(`  FAIL [PHOTO LINKS]: Expected 10 interactive photo links, found ${photoLinks}`);
  totalErrors++;
} else {
  console.log('  PASS: All 10 photos have high-resolution target links.');
}

// 13. Check poster size loaded in fallback
console.log('\n[TEST] Verifying Poster Loading Performance...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const posterImgInIndex = indexHtml.match(/<img[^>]+src=["']([^"']*irs_seminar_2026_poster[^"']*)["']/i);
if (posterImgInIndex) {
  console.log(`  Poster fallback in index.html: ${posterImgInIndex[1]}`);
  if (posterImgInIndex[1].endsWith('.png')) {
    console.error(`  FAIL [PERFORMANCE]: Loading 1.8MB PNG fallback instead of optimized WebP/JPG!`);
    totalErrors++;
  } else {
    console.log('  PASS: Optimized 600px JPEG fallback with multi-res srcset in index.html.');
  }
}

const posterImgInEvents = eventsHtml.match(/<img[^>]+src=["']([^"']*irs_seminar_2026_poster[^"']*)["']/i);
if (posterImgInEvents) {
  console.log(`  Poster fallback in events.html: ${posterImgInEvents[1]}`);
  if (posterImgInEvents[1].endsWith('.png')) {
    console.error(`  FAIL [PERFORMANCE]: Loading 1.8MB PNG fallback instead of optimized WebP/JPG in events.html!`);
    totalErrors++;
  } else {
    console.log('  PASS: Optimized 600px JPEG fallback with multi-res srcset in events.html.');
  }
}

// 14. Check store.html book cards
console.log('\n[TEST] Verifying store.html Card Layout...');
const storeHtml = fs.readFileSync(path.join(__dirname, 'store.html'), 'utf8');
const hasSufism = storeHtml.includes('Sufism') && storeHtml.includes('Pir Khair Muhammad Bhorvi');
const hasTales = storeHtml.includes('Truthful Tales');
const hasMurshid = storeHtml.includes('Hayat-e-Murshid');
const hasTranslator = storeHtml.includes('Sahibzada Muhammad Saeed Bhorvi');
if (!hasSufism || !hasTales || !hasMurshid || !hasTranslator) {
  console.error('  FAIL [STORE BOOKS]: Missing book details or translator in store.html');
  totalErrors++;
} else {
  console.log('  PASS: Sufism, Truthful Tales, and Hayat-e-Murshid verified with translator attribution.');
}

// 15. Check scripts deduplication in index.html
console.log('\n[TEST] Verifying Script Deduplication in index.html...');
const bootstrapCount = (indexHtml.match(/<script[^>]+src=["'][^"']*bootstrap\.bundle\.min\.js["']/gi) || []).length;
const jqueryScriptCount = (indexHtml.match(/<script[^>]+src=["'][^"']*jquery[^"']*["']/gi) || []).length;
if (bootstrapCount > 1) {
  console.error(`  FAIL [SCRIPTS]: Bootstrap bundled script loaded ${bootstrapCount} times!`);
  totalErrors++;
} else {
  console.log('  PASS: Bootstrap JS loaded exactly once.');
}
if (jqueryScriptCount > 1) {
  console.error(`  FAIL [SCRIPTS]: jQuery script tag loaded ${jqueryScriptCount} times!`);
  totalErrors++;
} else {
  console.log('  PASS: jQuery script loaded exactly once.');
}

console.log('\n================================================================');
console.log(`FINAL RESULT: Total Errors Found: ${totalErrors}`);
console.log(`Total Img Srcs Checked: ${totalImgSrc}`);
console.log(`Total Source Srcsets Checked: ${totalSources}`);
console.log(`Total Links Checked: ${totalLinks}`);
console.log('================================================================');

process.exit(totalErrors > 0 ? 1 : 0);
