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

let failed = false;

console.log('--- TEST 1: Check Announcement Bar Text Across All Pages ---');
const forbiddenPhrase = 'English editions of';
for (const file of files) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const barMatch = content.match(/<aside class="top-announcement-bar"[\s\S]*?<\/aside>/);
  if (!barMatch) {
    console.error(`FAIL: ${file} missing top-announcement-bar`);
    failed = true;
    continue;
  }
  if (barMatch[0].includes(forbiddenPhrase)) {
    console.error(`FAIL: ${file} top-announcement-bar still contains "${forbiddenPhrase}"!`);
    failed = true;
  } else {
    const textMatch = barMatch[0].match(/<span class="announcement-text">([\s\S]*?)<\/span>/);
    const cleaned = textMatch ? textMatch[1].replace(/\s+/g, ' ').trim() : '';
    console.log(`PASS: ${file} => ${cleaned}`);
  }
}

console.log('\n--- TEST 2: Check Announcement Bar CSS on All Pages ---');
for (const file of files) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const hasInlineBarCss = content.includes('.top-announcement-bar {');
  const linksStyleCss = content.includes('href="style.css"');
  if (!hasInlineBarCss && !linksStyleCss) {
    console.error(`FAIL: ${file} has neither inline .top-announcement-bar CSS nor style.css link!`);
    failed = true;
  } else {
    console.log(`PASS: ${file} has announcement bar styling (${hasInlineBarCss ? 'inline <style>' : 'linked style.css'}).`);
  }
}

console.log('\n--- TEST 3: Check Store Page Hayat-e-Murshid WhatsApp Button ---');
const storeContent = fs.readFileSync(path.join(__dirname, 'store.html'), 'utf8');
const murshidCardMatch = storeContent.match(/<!-- BOOK CARD: Hayat-e-Murshid -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (!murshidCardMatch) {
  console.error('FAIL: Could not find Hayat-e-Murshid card in store.html');
  failed = true;
} else {
  const cardHtml = murshidCardMatch[0];
  const hasWhatsApp = cardHtml.includes('wa.me') && cardHtml.includes('Order via WhatsApp');
  if (!hasWhatsApp) {
    console.error('FAIL: Hayat-e-Murshid card missing Order via WhatsApp button in store.html!');
    failed = true;
  } else {
    console.log('PASS: Hayat-e-Murshid card contains Order via WhatsApp button.');
  }
}

console.log('\n--- TEST 4: Check Home Page Our Work Section ---');
const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ourWorkMatch = indexContent.match(/<h2[^>]*>Our Work<\/h2>[\s\S]*?<\/section>/);
if (!ourWorkMatch) {
  console.error('FAIL: Could not find Our Work section in index.html');
  failed = true;
} else {
  const workHtml = ourWorkMatch[0];
  const hasSufism = workHtml.includes('Sufism');
  const hasTales = workHtml.includes('Truthful Tales');
  const hasMurshid = workHtml.includes('Hayat-e-Murshid');
  const hasSwiperWorks = workHtml.includes('worksSwiper');
  const hasBook1 = workHtml.includes('images/book1.jpg');
  const hasBook2 = workHtml.includes('images/book2.jpg');
  const hasNewBook = workHtml.includes('images/newbook.png');
  const hasWhatsAppInWork = workHtml.includes('Order via WhatsApp');

  console.log('  Sufism in Our Work:', hasSufism);
  console.log('  Truthful Tales in Our Work:', hasTales);
  console.log('  Hayat-e-Murshid in Our Work:', hasMurshid);
  console.log('  Images present (book1, book2, newbook):', hasBook1 && hasBook2 && hasNewBook);
  console.log('  WhatsApp order buttons present in Our Work:', hasWhatsAppInWork);

  if (!hasSufism || !hasTales || !hasMurshid || !hasSwiperWorks || !hasBook1 || !hasBook2 || !hasNewBook) {
    console.error('FAIL: Our Work section is missing required books or assets!');
    failed = true;
  } else {
    console.log('PASS: All 3 books (Sufism, Truthful Tales, Hayat-e-Murshid) properly configured in Our Work.');
  }
}

console.log('\n--- TEST 5: Check Swiper Navigation and Pagination Classes ---');
const scriptContent = fs.readFileSync(path.join(__dirname, 'js/script.js'), 'utf8');
const hasScopedWorksSwiper = scriptContent.includes('.works-swiper-pagination') && scriptContent.includes('.works-swiper-next');
if (!hasScopedWorksSwiper) {
  console.error('FAIL: worksSwiper not properly scoped in js/script.js');
  failed = true;
} else {
  console.log('PASS: worksSwiper properly scoped in js/script.js');
}

if (failed) {
  console.error('\nOVERALL VERIFICATION: FAILED');
  process.exit(1);
} else {
  console.log('\nOVERALL VERIFICATION: PASSED ALL TESTS!');
  process.exit(0);
}
