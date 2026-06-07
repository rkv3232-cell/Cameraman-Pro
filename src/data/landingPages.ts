export interface LandingPageFeature {
  title: string;
  desc: string;
}

export interface LandingPageFAQ {
  question: string;
  answer: string;
}

export interface LandingPageData {
  slug: string;
  keyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  features: LandingPageFeature[];
  faqs: LandingPageFAQ[];
}

export const landingPages: LandingPageData[] = [
  {
    slug: "photography-studio-management-software",
    keyword: "Photography Studio Management Software",
    title: "Photography Studio Management Software - Cameraman Pro",
    metaDescription: "Streamline your photography studio operations with Cameraman Pro. Manage booking calendars, client communication, contracts, and invoicing in one dashboard.",
    h1: "All-in-One Photography Studio Management Software",
    intro: "Transform the way you run your photography studio. Cameraman Pro is built by photographers, for photographers, to help automate bookings, organize team members, track client albums, and handle billing without the daily chaos.",
    features: [
      { title: "Visual Shoot Calendar", desc: "Easily schedule shoots, manage studio availability, and assign crew members with an intuitive drag-and-drop calendar." },
      { title: "Automated Workflows", desc: "Send automated booking confirmations, custom payment reminders, and feedback surveys to clients instantly." },
      { title: "Real-time Profit Analytics", desc: "Track revenue, calculate operating costs, and monitor staff performance metrics dynamically from your dashboard." }
    ],
    faqs: [
      { question: "What is photography studio management software?", answer: "It is a specialized tool designed to automate administrative tasks for studio owners, including appointment scheduling, invoicing, client communication, and team coordination." },
      { question: "Can I manage multiple studios with Cameraman Pro?", answer: "Yes, Cameraman Pro allows multi-workspace isolation, enabling you to manage different photography brands or locations from a single dashboard." },
      { question: "Is my client data safe?", answer: "Absolutely. All information is secured in Firebase databases with strict access permissions and localized session cleanup." }
    ]
  },
  {
    slug: "wedding-photography-crm",
    keyword: "Wedding Photography CRM",
    title: "Wedding Photography CRM & Client Tracker | Cameraman Pro",
    metaDescription: "The ultimate CRM built for wedding photographers. Track client inquiries, manage contracts, schedule shoot timelines, and streamline invoice collection.",
    h1: "Lead & Client Management CRM for Wedding Photographers",
    intro: "Managing inquiries for a wedding season can be overwhelming. Cameraman Pro's CRM organizes your lead pipeline from initial contact to album delivery, ensuring no follow-up gets missed.",
    features: [
      { title: "Enquiry Pipeline Tracker", desc: "Monitor every client inquiry, status changes, and follow-ups through a structured visual kanban pipeline." },
      { title: "Digital Contracts & Signatures", desc: "Create, share, and sign legal wedding shoot contracts digitally to secure bookings faster." },
      { title: "Payment Milestone Tracking", desc: "Configure custom milestone schedules (e.g. 50% advance, 30% on shoot day, 20% on delivery) with auto-alerts." }
    ],
    faqs: [
      { question: "How does a CRM benefit wedding photographers?", answer: "A CRM automates follow-ups, stores client requirements, tracks billing milestones, and helps secure contracts, preventing lead leakage during busy wedding seasons." },
      { question: "Can I customize the client inquiry form?", answer: "Yes. Our public inquiry system lets you embed customizable forms directly onto your website or social media bio links." },
      { question: "Does it support payment tracking?", answer: "Yes, you can track advance deposits, pending invoices, and record multiple payment modes like UPI, Net Banking, or Cash." }
    ]
  },
  {
    slug: "photographer-booking-system",
    keyword: "Photographer Booking System",
    title: "Online Photographer Booking System & Scheduler - Cameraman Pro",
    metaDescription: "Let clients view your availability, select packages, sign contracts, and pay advances online with Cameraman Pro's photographer booking system.",
    h1: "Seamless Online Photographer Booking System",
    intro: "Eliminate back-and-forth emails. Provide your clients with a self-service booking page where they can select services, check calendar slots, pay deposit amounts, and lock in their sessions.",
    features: [
      { title: "Custom Booking Packages", desc: "Build tailored service lists detailing hour limits, photographer tiers, delivery outputs, and exact prices." },
      { title: "Secure Advance Payments", desc: "Integrate online payment steps during checkout to ensure bookings are only locked after deposits are made." },
      { title: "Auto-Block Calendar Conflict", desc: "Real-time double-booking prevention synced directly with your studio's master calendar." }
    ],
    faqs: [
      { question: "Can clients book sessions on mobile?", answer: "Yes, the booking system is fully responsive, looking stunning on all smartphones, tablets, and desktops." },
      { question: "How are booking slots verified?", answer: "The booking calendar reads the real-time availability of your photographers and blocks slots instantly upon confirmation." },
      { question: "Can clients reschedule their shoot?", answer: "Yes, studio admins can reschedule bookings from the dashboard, which dynamically updates the client's tracking page." }
    ]
  },
  {
    slug: "photography-business-software",
    keyword: "Photography Business Software",
    title: "Photography Business Management Software - Cameraman Pro",
    metaDescription: "All-in-one software for photography business owners. Manage invoicing, staff attendance, equipment inventory, and client portals in one place.",
    h1: "Enterprise-grade Photography Business Software",
    intro: "Take control of your photography business. From scheduling assignments to tracking camera inventory, Cameraman Pro provides the robust tools needed to scale a creative brand.",
    features: [
      { title: "Equipment & Gear Tracking", desc: "Manage camera bodies, lenses, and lighting equipment. Assign gear to specific shoots and prevent double-allocation." },
      { title: "Expense & Revenue Ledger", desc: "Categorize business expenses (travel, rentals, staff salaries) and match them against shoot revenues to compute margins." },
      { title: "Performance Reporting", desc: "View detailed statistics on your most profitable shoots, top-rated crew members, and client acquisition channels." }
    ],
    faqs: [
      { question: "Is this software suitable for solo photographers?", answer: "Yes, while Cameraman Pro is built to handle large teams, its simple interface is perfect for solo professionals looking to structure their workflows." },
      { question: "Can I generate PDF invoices?", answer: "Yes, you can generate professional tax invoices, track payment status, and share PDF copies with clients." },
      { question: "Does it help track business expenses?", answer: "Yes, the expense module lets you log outlays, upload receipts, and tie expenditures to specific bookings for accurate profitability analysis." }
    ]
  },
  {
    slug: "client-management-software-photographers",
    keyword: "Client Management Software for Photographers",
    title: "Client Management Software for Photographers - Cameraman Pro",
    metaDescription: "Elevate the customer experience. Share digital photo galleries, track selection statuses, and communicate securely via private client portals.",
    h1: "Premium Client Management Software for Photographers",
    intro: "Deliver a premium, high-end experience that client couples will talk about. Cameraman Pro offers private portal access where clients can view contract milestones, track order progress, and select photos.",
    features: [
      { title: "Private Client Portals", desc: "Every client gets a dedicated secure link containing their order timeline, files, and billing overview." },
      { title: "Interactive Selection Workflow", desc: "Clients mark their favorite images directly inside a beautiful web gallery to initiate the editing phase." },
      { title: "Step-by-Step Order Tracking", desc: "Keep clients updated with a visual pizza-tracker style timeline of their photo editing and printing status." }
    ],
    faqs: [
      { question: "How do clients log in to their portal?", answer: "Clients log in using their verified phone number or email, receiving a secure link without needing complex passwords." },
      { question: "Can they select images for album design?", answer: "Yes, our selection portal lets clients view high-res previews, filter by tags, and submit their selection directly to your editors." },
      { question: "Is there a limit on client accounts?", answer: "No, you can create and manage unlimited client profiles and folders in Cameraman Pro." }
    ]
  },
  {
    slug: "studio-booking-software-india",
    keyword: "Studio Booking Software India",
    title: "Studio Booking & Scheduling Software in India - Cameraman Pro",
    metaDescription: "The leading studio booking software built for Indian photography businesses. Manage GST invoices, UPI payments, and wedding seasonal calendars.",
    h1: "The Best Studio Booking Software for Indian Photographers",
    intro: "Tailored specifically for the Indian wedding and commercial photography ecosystem. Cameraman Pro supports local payment methods, GST calculations, and handles peak wedding season scheduling conflicts with ease.",
    features: [
      { title: "UPI & Local Payment Tracking", desc: "Record UPI transfers, bank details, GPay payments, and cash deposits, keeping your books fully aligned." },
      { title: "GST & Custom Tax Invoicing", desc: "Automatically compute SGST, CGST, and IGST for your booking receipts and client bills." },
      { title: "Seasonal Peak Management", desc: "Get visual alerts when booking multiple events on popular wedding dates (Muhurats) to avoid resource bottlenecks." }
    ],
    faqs: [
      { question: "Does the software support GST invoicing?", answer: "Yes, you can input your studio's GSTIN and configure custom tax slabs to output tax invoices." },
      { question: "How does UPI payment logging work?", answer: "You can display your UPI QR code to clients on invoices, and log transactions with their UTR numbers for auditing." },
      { question: "Is the interface optimized for Indian networks?", answer: "Yes, the app is built on a lightweight Progressive Web App architecture, loading fast even on 3G and 4G connections." }
    ]
  },
  {
    slug: "wedding-album-tracking-software",
    keyword: "Wedding Album Tracking Software",
    title: "Wedding Album Tracking & Proofing Software - Cameraman Pro",
    metaDescription: "Speed up wedding album delivery. Track sorting, retouching, printing, and shipping phases while collaborating with clients.",
    h1: "Dynamic Wedding Album Tracking & Proofing Software",
    intro: "Delivering wedding albums often causes the longest delays. Cameraman Pro bridges the gap with automated proofing workflows, selection status tracking, and delivery timelines.",
    features: [
      { title: "Multi-stage Editing Pipeline", desc: "Track albums through sorting, editing, client approval, printing, and shipping stages in real-time." },
      { title: "Dynamic Client Approval", desc: "Let clients view proof layouts, submit revision feedback, and approve the final version digitally." },
      { title: "Shipping & Courier Tracking", desc: "Log tracking IDs and courier partners, notifying clients automatically when their album ships." }
    ],
    faqs: [
      { question: "What is album proofing?", answer: "It is the process where clients view layout drafts and request changes or approve them for final print production." },
      { question: "Can clients leave comments on specific pages?", answer: "Yes, clients can log feedback notes on each photo sheet, making corrections clear for your design team." },
      { question: "Does it notify clients of updates?", answer: "Yes, clients receive email or SMS updates when their order moves from editing to printing and dispatch." }
    ]
  },
  {
    slug: "photography-team-management-software",
    keyword: "Photography Team Management Software",
    title: "Photography Team & Crew Management Software - Cameraman Pro",
    metaDescription: "Coordinate photographers, videographers, editors, and drone operators. Track attendance, event check-ins, and payouts.",
    h1: "Photography Crew & Team Management Software",
    intro: "Managing freelance crews and full-time staff can be hectic. Cameraman Pro offers a dedicated crew dashboard where team members can check event details, log attendance, and view payments.",
    features: [
      { title: "Crew Member Verification", desc: "Issue secure QR code digital profile badges to verified staff for client-side trust check-ins." },
      { title: "Geo-locked Attendance Check-in", desc: "Enable crew members to log check-ins directly at shoot venues with GPS location logging." },
      { title: "Freelance Payment Ledger", desc: "Calculate daily rates, track pending payouts, and manage shoot expense claims from one dashboard." }
    ],
    faqs: [
      { question: "How do crew members see their shoots?", answer: "They can log in to their mobile-friendly crew portal to see assigned dates, locations, client info, and gear lists." },
      { question: "Can I restrict staff access to client files?", answer: "Yes. Role-based permissions ensure crew members only see information required for their assigned shoots." },
      { question: "Does it support freelance rate configurations?", answer: "Yes, you can set fixed daily rates or variable payouts for each crew member per shoot type." }
    ]
  },
  {
    slug: "cameraman-booking-app-india",
    keyword: "Cameraman Booking App India",
    title: "Cameraman & Crew Booking App India - Cameraman Pro",
    metaDescription: "Find, allocate, and book cameramen, editors, and drone operators for shoots in India. Manage freelancer availability and travel schedules.",
    h1: "On-demand Cameraman & Crew Booking System in India",
    intro: "Keep your production crew running smoothly. Easily book cameramen, video editors, and sound technicians for Indian weddings, corporate shoots, and studio events.",
    features: [
      { title: "Freelancer Availabilities", desc: "Crews update their calendars so you only assign available professionals to wedding dates." },
      { title: "Travel & Logistical Expense Logging", desc: "Log crew train, flight, or hotel details and automatically track travel allowances." },
      { title: "Verified Crew Profiles", desc: "Publicly share staff badges to clients, proving the authenticity of the photographer arriving at the event." }
    ],
    faqs: [
      { question: "How does crew check-in work?", answer: "Crews open their dashboard on-site, click Check-in, and the app logs their timestamp and GPS coordinates." },
      { question: "Can I manage multiple bookings per day?", answer: "Yes, you can assign different teams to different clients on the same date with zero conflict." },
      { question: "Is there a mobile app?", answer: "Cameraman Pro is built on a responsive PWA layout that runs beautifully on Android and iOS." }
    ]
  },
  {
    slug: "wedding-photography-studio-software",
    keyword: "Wedding Photography Studio Software",
    title: "Wedding Photography Studio Software - Cameraman Pro",
    metaDescription: "Designed for premium wedding studios. Coordinate multi-day event schedules, manage camera crew logistics, and share digital proofs.",
    h1: "Premium Wedding Photography Studio Software",
    intro: "Wedding photography studios require robust coordination tools to manage multi-day events, multiple camera operators, and client communications. Cameraman Pro is built specifically to address these needs.",
    features: [
      { title: "Multi-day Event Itineraries", desc: "Schedule separate crew, timing, and gear lists for Haldi, Mehendi, Sangeet, Wedding, and Reception events." },
      { title: "Centralized Asset Delivery", desc: "Upload and deliver high-res teasers, raw files, and fully-edited wedding films through one client portal." },
      { title: "Dynamic Client Feedback", desc: "Track client revisions for teaser drafts, album print layouts, and video timelines directly." }
    ],
    faqs: [
      { question: "Can we handle multiple wedding events in a single booking?", answer: "Yes, you can add sub-events to a single booking, each with its own start time, crew, and location." },
      { question: "How do we deliver video files?", answer: "You can embed Vimeo, YouTube, or Google Drive links directly in the client portal for seamless playback." },
      { question: "Is client privacy maintained?", answer: "Yes, each portal has security tokens, preventing unauthorized access to wedding galleries." }
    ]
  },
  {
    slug: "photography-billing-software-india",
    keyword: "Photography Billing Software India",
    title: "Photography Invoicing & Billing Software India - Cameraman Pro",
    metaDescription: "Generate professional GST bills, record advance deposits, track payments, and manage expenses. Designed for Indian photography studios.",
    h1: "GST-Compliant Photography Billing Software in India",
    intro: "Invoicing clients doesn't have to be manual. Generate tax-compliant estimates, convert them to invoices, send payment alerts, and maintain clear records of UPI and cash advances.",
    features: [
      { title: "Automated GST Computations", desc: "Apply appropriate SGST, CGST, or IGST rates based on client billing state locations automatically." },
      { title: "Payment Milestone Alerts", desc: "Send automated SMS or WhatsApp-compatible payment reminders for upcoming milestones." },
      { title: "Digital Receipts", desc: "Instantly create professional receipts with customized branding for every client transaction." }
    ],
    faqs: [
      { question: "Can I issue quotes and estimates?", answer: "Yes, you can generate quotes, send them for digital approval, and convert them to invoices with one click." },
      { question: "Does it support offline payments?", answer: "Yes, you can log bank transfers, cash payments, check deposits, and UPI transactions." },
      { question: "Can I customize the invoice branding?", answer: "Absolutely. Add your studio logo, terms, bank details, and custom signature styles." }
    ]
  },
  {
    slug: "photo-studio-management-app",
    keyword: "Photo Studio Management App",
    title: "Photo Studio Management & Booking App | Cameraman Pro",
    metaDescription: "Manage your photography studio from anywhere. Access schedules, check-in equipment, approve crew payments, and track client orders on mobile.",
    h1: "Modern Photo Studio Management App",
    intro: "Run your creative studio on the go. Cameraman Pro's mobile-friendly PWA lets you check team rosters, view booking calendars, track order stages, and manage clients from any smartphone.",
    features: [
      { title: "Responsive PWA Architecture", desc: "Access the complete feature set without needing slow app store updates. Add to home screen instantly." },
      { title: "Push Notification System", desc: "Receive immediate updates on new client inquiries, payment updates, and crew check-ins." },
      { title: "Mobile Quick-Actions", desc: "Call clients, direct crew via Google Maps links, and log quick expenses on the go." }
    ],
    faqs: [
      { question: "Is it compatible with iOS and Android?", answer: "Yes, being a Progressive Web App, it runs natively on both Safari (iOS) and Chrome (Android)." },
      { question: "Does the app consume a lot of space?", answer: "No, it takes less than 5MB of storage on your device while caching essential assets locally." },
      { question: "Can crew members check-in offline?", answer: "Crew members need an internet connection to log real-time GPS locations and timestamps." }
    ]
  },
  {
    slug: "freelance-photographer-crm",
    keyword: "Freelance Photographer CRM",
    title: "Freelance Photographer CRM & Scheduler | Cameraman Pro",
    metaDescription: "Simplifying administration for freelance photographers. Automate booking forms, track client invoices, and schedule shoots effortlessly.",
    h1: "The Best Freelance Photographer CRM",
    intro: "Focus on your art, not on the spreadsheets. Cameraman Pro helps freelance photographers automate client onboarding, invoice creation, booking schedules, and project delivery.",
    features: [
      { title: "Lead Intake Forms", desc: "Embed sleek, modern intake forms on your website or share them directly on Instagram bio links." },
      { title: "Flexible Invoicing", desc: "Generate professional billing for day-rates, licensing fees, or print packages with custom discounts." },
      { title: "Shoot Checklists", desc: "Create task lists for prep, shoot day, backup, and retouching phases to keep your freelance work organized." }
    ],
    faqs: [
      { question: "Is this CRM good for part-time photographers?", answer: "Yes, it helps you maintain professional client communication and organized calendars alongside other work." },
      { question: "Can I import existing client details?", answer: "Yes, you can easily create client profiles and add historical booking notes to their timelines." },
      { question: "How does contract signing work?", answer: "You can write or paste terms, and clients sign digitally from their mobile browser." }
    ]
  },
  {
    slug: "photography-calendar-scheduling-software",
    keyword: "Photography Calendar & Scheduling Software",
    title: "Photography Calendar & Scheduling Software - Cameraman Pro",
    metaDescription: "Coordinate your shoot schedule. Sync photographer availabilities, allocate camera gear, and prevent scheduling conflicts.",
    h1: "Advanced Photography Scheduling & Calendar Software",
    intro: "Say goodbye to double-booked dates. Cameraman Pro's calendar is built for the complexity of multi-photographer studios, letting you schedule crew, gear, and locations in real-time.",
    features: [
      { title: "Resource Allocation", desc: "Assign specific crew members and equipment to events directly from the calendar layout." },
      { title: "Multi-Calendar Views", desc: "Filter schedule views by team, client, studio room, or location type for absolute clarity." },
      { title: "Live Sync", desc: "Updates made to schedules instantly reflect on the crew dashboard and client tracking pages." }
    ],
    faqs: [
      { question: "Does the calendar support multiple timezones?", answer: "Yes, scheduling adjusts dynamically based on the local time zones of your crew and clients." },
      { question: "Can I block personal holidays?", answer: "Yes, crew members and admins can block out unavailable dates, preventing them from being scheduled for shoots." },
      { question: "Are reschedule updates automated?", answer: "Yes, changing an event date dynamically updates all assigned team notifications and client portals." }
    ]
  },
  {
    slug: "wedding-photography-workflow-software",
    keyword: "Wedding Photography Workflow Software",
    title: "Wedding Photography Workflow Management | Cameraman Pro",
    metaDescription: "Speed up your delivery times. Manage culling, color grading, retouches, client proofing, printing, and delivery stages.",
    h1: "Streamlined Wedding Photography Workflow Software",
    intro: "Take control of your post-production. Cameraman Pro provides visual kanban pipelines to track shoot files from raw card backups to final client album handovers.",
    features: [
      { title: "Visual Kanban Boards", desc: "Track project cards through Culling, Editing, Proofing, Printing, and Shipped statuses." },
      { title: "Editor Assignment", desc: "Delegate sorting and color correction to specialized internal or freelance video/photo editors." },
      { title: "Client Approval Loops", desc: "Review comments and client sign-offs directly linked to task cards, avoiding communication confusion." }
    ],
    faqs: [
      { question: "How does the workflow pipeline save time?", answer: "It eliminates confusion by showing everyone exactly which stage a project is in and who is responsible for the next action." },
      { question: "Can I create customized stages?", answer: "Yes, you can configure stages that match your studio's specific editing and printing steps." },
      { question: "Does it track film editing too?", answer: "Yes, it is designed to manage videography, cinematic trailers, documentary edits, and photos alike." }
    ]
  },
  {
    slug: "client-album-selection-software",
    keyword: "Client Album Selection Software",
    title: "Client Photo & Album Selection Software - Cameraman Pro",
    metaDescription: "Beautiful digital proofing galleries. Let clients select photos, write comments, and approve layouts on any device.",
    h1: "Interactive Client Photo & Album Selection Software",
    intro: "Get rid of confusing email lists. Deliver stunning, mobile-responsive web galleries where clients click heart icons to select images for retouching or album prints.",
    features: [
      { title: "High-Speed Galleries", desc: "Optimized image grids that load fast on mobile devices, even with hundreds of high-res previews." },
      { title: "One-Click Selections", desc: "Clients review, filter, search, and submit selected files directly to the studio admin." },
      { title: "Download & Print Control", desc: "Configure custom permissions for downloads (high-res or watermarked) and album layouts." }
    ],
    faqs: [
      { question: "How many images can clients select?", answer: "You can set custom selection limits (e.g. choose 50 photos out of 500) per client gallery." },
      { question: "Are the selection galleries mobile-friendly?", answer: "Yes, clients can review and select photos comfortably from their iPhones or Android devices." },
      { question: "Can I add watermarks?", answer: "Yes, you can enable custom overlay watermarks to protect your previews before purchase." }
    ]
  },
  {
    slug: "photography-expense-tracker-app",
    keyword: "Photography Expense Tracker App",
    title: "Photography Expense & Budget Tracker App - Cameraman Pro",
    metaDescription: "Track travel costs, equipment depreciation, staff payouts, and studio rent. Compute exact profit margins per photography gig.",
    h1: "In-depth Expense & Profit Tracker for Photographers",
    intro: "Know exactly how much money your photography business is making. Track all overhead expenses, assign direct costs to bookings, and review gross and net profit margins.",
    features: [
      { title: "Booking-Linked Expenses", desc: "Log crew travel, taxi fares, assistant rates, and food costs directly to specific client projects." },
      { title: "Ledger Categories", desc: "Organize payments by software subscriptions, gear purchases, studio marketing, and office rent." },
      { title: "Monthly P&L Analytics", desc: "View dynamic charts comparing billing totals against outlays to show cash flows and profit." }
    ],
    faqs: [
      { question: "Can staff members file expense reports?", answer: "Yes, crew members can log expense claims from their portal, which admins approve or reject." },
      { question: "Is this database exportable?", answer: "Yes, you can export your entire financial ledger to CSV or Excel for tax filing and audits." },
      { question: "Does it track equipment depreciation?", answer: "You can log gear purchases as capital assets and record depreciation offsets in the ledger." }
    ]
  },
  {
    slug: "studio-client-portal-software",
    keyword: "Studio Client Portal Software",
    title: "Studio Client Portal Software - Cameraman Pro",
    metaDescription: "Private portals for photography clients. Track shoot schedules, review wedding contracts, view invoices, and approve proofs.",
    h1: "White-label Studio Client Portal Software",
    intro: "Provide a seamless experience. Keep your clients updated with custom portal links containing all contract agreements, payment schedules, and photo delivery links.",
    features: [
      { title: "Centralized Communications", desc: "Ditch Whatsapp threads. Keep all shoot locations, contact numbers, and guidelines in one secure page." },
      { title: "Secure Transactions", desc: "Clients can review unpaid invoices, access payment histories, and download PDF receipts." },
      { title: "Interactive Timelines", desc: "Show client couples where their project stands (Raw Backup, Editing, Proofing, Album Printing)." }
    ],
    faqs: [
      { question: "Do clients need to download an app?", answer: "No, they just open a secure web link that works natively in any browser on mobile and desktop." },
      { question: "Can I customize the client portal branding?", answer: "Yes, you can configure your studio logo, cover image, and contact details." },
      { question: "Is the portal secure?", answer: "Yes, each portal uses a cryptographically secure token, preventing unauthorized access." }
    ]
  },
  {
    slug: "photography-crew-management-system",
    keyword: "Photography Crew & Staff Management System",
    title: "Photography Crew & Staff Management - Cameraman Pro",
    metaDescription: "Optimize staff schedules. Track photographer availability, geo-checkins at venues, and freelance payment rates.",
    h1: "Ultimate Photography Crew Management System",
    intro: "Coordinate camera crews with precision. Track staff schedules, log check-in metrics on-site, and manage freelance payouts and travel expenses systematically.",
    features: [
      { title: "Roster Management", desc: "Assign lead photographers, assistant shooters, videographers, and editors to bookings based on availability." },
      { title: "Venue Check-In Logs", desc: "Capture real-time timestamps and GPS locations when staff check-in at wedding venues." },
      { title: "Automated Pay Sheets", desc: "Generate summary sheets detailing pending freelance fees, daily rates, and reimbursement claims." }
    ],
    faqs: [
      { question: "Does it prevent crew double-booking?", answer: "Yes, the system warns you if a crew member is already scheduled for another shoot on that date." },
      { question: "Can crews see the venue coordinates?", answer: "Yes, the crew dashboard provides deep links to open locations directly in Google Maps." },
      { question: "How are crew accounts created?", answer: "Admins add crew members to the team ledger, which triggers invite links for account setup." }
    ]
  },
  {
    slug: "best-photography-erp-software-india",
    keyword: "Best Photography ERP Software India",
    title: "Best Photography ERP & Studio Management India | Cameraman Pro",
    metaDescription: "Scale your photography business in India. The only ERP tracking leads, booking calendars, crew logistics, equipment inventory, and finances.",
    h1: "The Absolute Best Photography ERP Software in India",
    intro: "Manage every department of your creative enterprise. Cameraman Pro acts as a robust ERP system, unifying sales, project management, staffing, inventory, and accounting.",
    features: [
      { title: "Enterprise Resource Dashboard", desc: "Real-time visibility over active bookings, gear availability, employee attendance, and finances." },
      { title: "Cross-Department Workflows", desc: "Connect bookings directly to crew scheduling, equipment allocation, invoice generation, and post-production tasks." },
      { title: "Scalable Infrastructure", desc: "Built on high-performance cloud architecture to handle unlimited studio branches, users, and transactions." }
    ],
    faqs: [
      { question: "What makes this an ERP software?", answer: "It manages all business resources—finances, inventory, personnel, operations, and client relations—within a unified, relational database." },
      { question: "Does it support multiple photography branches?", answer: "Yes, you can set up separate workspaces for different branches while maintaining centralized admin control." },
      { question: "Can we migrate data from other systems?", answer: "Yes, our onboarding team can help import your client accounts and inventory data sheets." }
    ]
  }
];
