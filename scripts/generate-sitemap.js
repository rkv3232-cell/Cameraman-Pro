import fs from 'fs';
import path from 'path';

const slugs = [
  "photography-studio-management-software",
  "wedding-photography-crm",
  "photographer-booking-system",
  "photography-business-software",
  "client-management-software-photographers",
  "studio-booking-software-india",
  "wedding-album-tracking-software",
  "photography-team-management-software",
  "cameraman-booking-app-india",
  "wedding-photography-studio-software",
  "photography-billing-software-india",
  "photo-studio-management-app",
  "freelance-photographer-crm",
  "photography-calendar-scheduling-software",
  "wedding-photography-workflow-software",
  "client-album-selection-software",
  "photography-expense-tracker-app",
  "studio-client-portal-software",
  "photography-crew-management-system",
  "best-photography-erp-software-india"
];

const LANDING_PAGE_ROUTES = slugs.map(slug => ({
  path: `software/${slug}`,
  changefreq: 'weekly',
  priority: '0.8'
}));

const PUBLIC_ROUTES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'book-now', changefreq: 'weekly', priority: '0.9' },
  { path: 'gallery', changefreq: 'weekly', priority: '0.8' },
  { path: 'enquiry', changefreq: 'monthly', priority: '0.8' },
  { path: 'about', changefreq: 'monthly', priority: '0.7' },
  { path: 'contact', changefreq: 'monthly', priority: '0.7' },
  { path: 'track', changefreq: 'weekly', priority: '0.6' },
  { path: 'login', changefreq: 'monthly', priority: '0.5' },
  { path: 'pricing', changefreq: 'weekly', priority: '0.9' },
  { path: 'free-trial', changefreq: 'weekly', priority: '0.9' },
  { path: 'book-demo', changefreq: 'weekly', priority: '0.9' },
  { path: 'case-studies', changefreq: 'weekly', priority: '0.8' },
  { path: 'resources', changefreq: 'weekly', priority: '0.8' },
  ...LANDING_PAGE_ROUTES
];

const BASE_URL = 'https://cameraman-pro-2aa2b.web.app';
const currentDate = new Date().toISOString().split('T')[0];

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTES.map(route => `  <url>
    <loc>${BASE_URL}/${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
console.log('Successfully generated public/sitemap.xml!');

