import { ArrowRight, Camera, Star, Heart, Calendar, CheckCircle, Zap, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import LanguageContext from "../../context/LanguageContext";
import { ReviewsSection } from "../../components/public/ReviewsSection";
import { useSEO } from "../../hooks/useSEO";
import { useStructuredData } from "../../hooks/useStructuredData";

export const Home = () => {
  const { lang } = useContext(LanguageContext);
  const hi = lang === 'hi';

  useSEO({
    title: hi ? "Cameraman Pro | प्रीमियम स्टूडियो प्रबंधन और बुकिंग सॉफ्टवेयर" : "Cameraman Pro | Premium Studio Management & Booking Software",
    description: hi
      ? "फोटोग्राफरों और वीडियोग्राफरों के लिए अंतिम स्टूडियो प्रबंधन सॉफ्टवेयर। वेडिंग, बर्थडे, प्री-वेडिंग शूट आसानी से बुक करें।"
      : "The ultimate studio management and booking software for photographers, videographers, and creators. Easily schedule wedding, birthday, and pre-wedding shoots.",
    keywords: "photography studio software, studio management software, wedding photographer software, photography CRM, booking software for photographers",
  });

  useStructuredData({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Cameraman Pro",
    "image": `${window.location.origin}/cameraman-pro.png`,
    "@id": `${window.location.origin}/#localbusiness`,
    "url": window.location.origin,
    "telephone": "+919876543210",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Main Market Road",
      "addressLocality": "Jaipur",
      "addressRegion": "Rajasthan",
      "postalCode": "302001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 26.9124,
      "longitude": 75.7873
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "09:00",
      "closes": "21:00"
    },
    "sameAs": [
      "https://www.facebook.com/cameramanpro",
      "https://www.instagram.com/cameramanpro"
    ]
  }, "home-local-business-schema");

  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.platform && (window as any).Capacitor?.platform !== 'web';

  const services = [
    {
      icon: Heart,
      title: hi ? 'वेडिंग फोटोग्राफी' : 'Wedding Photography',
      description: hi ? 'पूरे दिन की सिनेमाई कवरेज' : 'Full day cinematic coverage',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: Camera,
      title: hi ? 'बर्थडे शूट' : 'Birthday Shoot',
      description: hi ? '2 घंटे, 50+ एडिटेड फोटो' : '2 hours, 50+ edited photos',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Zap,
      title: hi ? 'प्री-वेडिंग' : 'Pre-Wedding',
      description: hi ? 'कपल पोर्ट्रेट, 2 लोकेशन' : 'Couple portraits, 2 locations',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Award,
      title: hi ? 'CSC डिजिटल सेवाएं' : 'CSC Digital Services',
      description: hi ? 'PAN, आधार, सर्टिफिकेट, फॉर्म' : 'PAN, Aadhaar, certificates, forms',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const trustPoints = [
    { icon: Users, label: hi ? '1000+ खुश क्लाइंट' : '1000+ Happy Clients' },
    { icon: Star, label: hi ? '5 ⭐ रेटिंग' : '5 ⭐ Rating' },
    { icon: Award, label: hi ? '2018 से अनुभव' : 'Since 2018' },
    { icon: CheckCircle, label: hi ? '100% संतुष्टि गारंटी' : '100% Satisfaction Guarantee' },
  ];

  return (
    <div className="w-full relative overflow-hidden">

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[url('/luxury_wedding_shoot.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-[var(--bg-primary)]" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {trustPoints.map((tp, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-medium">
                <tp.icon size={12} /> {tp.label}
              </span>
            ))}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              {hi ? 'शूट बुक करें' : 'Book Your Shoot'}
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-white/90 font-bold">
              {hi ? '2 मिनट में ✨' : 'in 2 Minutes ✨'}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {hi ? 'वेडिंग, बर्थडे, प्री-वेडिंग — कैंडिड से सिनेमाई तक।' : 'Wedding, Birthday, Pre-Wedding — Candid to Cinematic.'}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/book-now" className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold hover:-translate-y-1 transition-all flex items-center gap-2 shadow-xl shadow-amber-500/30 text-lg">
              <Calendar size={22} /> {hi ? 'अभी बुक करें' : 'Book Now'} <ArrowRight size={22} />
            </Link>
            {!isCapacitor && (
              <a
                href="/cameraman-pro.png"
                download="cameraman-pro.apk"
                className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 hover:-translate-y-1 transition-all flex items-center gap-2 text-lg"
              >
                📲 {hi ? 'एंड्रॉयड ऐप डाउनलोड' : 'Download Android App'}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 px-4 bg-[var(--surface-base)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
              {hi ? 'हमारी सेवाएं' : 'Our Services'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-light)] hover:shadow-xl hover:-translate-y-2 transition-all text-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <s.icon size={28} className="text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-3">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* CTA */}
      <section className="py-20 text-center bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-rose-500/5 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            {hi ? 'आज ही अपना लम्हा बुक करें! 📸' : "Book Your Moment Today! 📸"}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link to="/book-now" className="px-10 py-4 rounded-full bg-[var(--accent-primary)] text-white font-bold hover:-translate-y-1 transition-all inline-flex items-center gap-2 shadow-lg shadow-[var(--accent-primary)]/30">
              {hi ? 'अभी बुक करें' : 'Book Now'} <ArrowRight size={20} />
            </Link>
            {!isCapacitor && (
              <a
                href="/cameraman-pro.png"
                download="cameraman-pro.apk"
                className="px-10 py-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] font-bold hover:-translate-y-1 transition-all inline-flex items-center gap-2"
              >
                📲 {hi ? 'ऐप डाउनलोड करें' : 'Download Android App'}
              </a>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
