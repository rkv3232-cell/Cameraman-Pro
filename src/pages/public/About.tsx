import teamImage from "../../assets/team.jpg";
import { useContext } from 'react';
import { Users, Award, Camera, Heart } from 'lucide-react';
import LanguageContext from '../../context/LanguageContext';
import { text } from '../../utils/text';
import { ReviewsSection } from '../../components/public/ReviewsSection';
import { useSEO } from '../../hooks/useSEO';
import { useStructuredData } from '../../hooks/useStructuredData';

export const About = () => {
    const { lang } = useContext(LanguageContext);
    const hi = lang === 'hi';

    useSEO({
        title: hi ? "हमारे बारे में | Cameraman Pro" : "About Us | Cameraman Pro",
        description: hi
            ? "Cameraman Pro की कहानी और विज़न। जानें कि कैसे हम आधुनिक उपकरणों, अत्यधिक कुशल वीडियोग्राफरों और एक शानदार टीम के साथ आपकी यादों को हमेशा के लिए सहेजते हैं।"
            : "Discover the story and vision of Cameraman Pro. Learn how our professional photography crew, high-end gear, and seamless workflow management make memories last forever.",
        keywords: "about cameraman pro, photography team, professional videographers, photography studio story",
    });

    useStructuredData({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About Cameraman Pro",
        "description": "Discover the story and vision of Cameraman Pro, our professional photography crew, high-end gear, and seamless workflow management.",
        "url": `${window.location.origin}/about`,
        "mainEntity": {
            "@type": "LocalBusiness",
            "name": "Cameraman Pro",
            "image": `${window.location.origin}/cameraman-pro.png`,
            "url": window.location.origin
        }
    }, "about-page-schema");

    return (
        <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
                        {text.about.storyBadge[lang]}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-6">
                        {text.about.title[lang]}
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
                        {text.about.intro[lang]}
                    </p>
                </div>

                {/* Studio Team Section */}
                <div className="relative w-full max-w-5xl mx-auto h-[500px] rounded-2xl overflow-hidden mb-24 shadow-2xl">
                    <img
                        src={teamImage}
                        alt="Studio Team"
                        className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{text.about.heroTitle[lang]}</h2>
                        <p className="text-white/80 max-w-2xl text-lg">{text.about.heroSubtitle[lang]}</p>
                    </div>
                </div>

                {/* Founders & Experience */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-[var(--text-primary)]">{text.about.foundersTitle[lang]}</h2>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            {text.about.founderParaOne[lang]}
                        </p>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            {text.about.founderParaTwo[lang]}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
                                <Users size={32} className="text-[var(--accent-primary)] mb-4" />
                                <h4 className="text-2xl font-bold text-[var(--text-primary)]">15+</h4>
                                <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wider">{text.about.statExpertTeam[lang]}</p>
                            </div>
                            <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
                                <Award size={32} className="text-amber-500 mb-4" />
                                <h4 className="text-2xl font-bold text-[var(--text-primary)]">65+</h4>
                                <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wider">{text.about.statAwards[lang]}</p>
                            </div>
                        </div>
                        <div className="space-y-4 mt-8">
                            <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
                                <Heart size={32} className="text-rose-500 mb-4" />
                                <h4 className="text-2xl font-bold text-[var(--text-primary)]">1000+</h4>
                                <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wider">{text.about.statCouples[lang]}</p>
                            </div>
                            <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
                                <Camera size={32} className="text-blue-500 mb-4" />
                                <h4 className="text-2xl font-bold text-[var(--text-primary)]">100%</h4>
                                <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wider">{text.about.statGear[lang]}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReviewsSection />
        </div>
    );
};
