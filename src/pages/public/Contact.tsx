import { useContext } from 'react';
import { MapPin, Phone } from 'lucide-react';
import LanguageContext from '../../context/LanguageContext';
import { text } from '../../utils/text';

export const Contact = () => {
    const { lang } = useContext(LanguageContext);
    return (
        <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
                        {text.contact.badge[lang]}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6">
                        {text.contact.title[lang]}
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        {text.contact.subtitle[lang]}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

                    {/* Contact Cards */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="bg-[var(--surface-base)] p-8 rounded-2xl border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow">
                            <Phone className="text-emerald-500 mb-4" size={32} />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{text.contact.callUsTitle[lang]}</h3>
                            <p className="text-[var(--text-secondary)] mb-4">{text.contact.callUsDesc[lang]}</p>
                            <div className="space-y-2">
                                <a href="tel:8601343232" className="block text-lg font-semibold text-[var(--accent-primary)] hover:underline">+91 8601343232</a>
                                <p className="text-xs text-[var(--text-tertiary)]">Chandan Kumar Verma</p>
                            </div>
                        </div>

                        <div className="bg-[var(--surface-base)] p-8 rounded-2xl border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow">
                            <MapPin className="text-orange-500 mb-4" size={32} />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{text.contact.visitTitle[lang]}</h3>
                            <p className="text-[var(--text-secondary)] mb-4">{text.contact.visitDesc[lang]}</p>
                            <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                                Cameraman Pro Studios<br />
                                Dullahapur, Ghazipur<br />
                                Uttar Pradesh, India - 275202
                            </p>
                        </div>
                    </div>

                    {/* Map & WhatsApp CTA */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-full h-[420px] rounded-2xl overflow-hidden border border-[var(--border-light)] shadow-lg">
                            <iframe
                                src="https://www.google.com/maps?q=Raj+Video+Mixing+Lab+Dullahapur+Ghazipur+Uttar+Pradesh+275202&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-white text-center md:text-left">
                                <h3 className="text-2xl font-bold mb-2">{text.contact.chatTitle[lang]}</h3>
                                <p className="text-emerald-100">{text.contact.chatDesc[lang]}</p>
                            </div>
                            <a
                                href="https://wa.me/918601343232?text=Hello%20Cameraman%20Pro!%20I%20have%20an%20enquiry."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all whitespace-nowrap flex items-center gap-2"
                            >
                                {text.contact.whatsappButton[lang]}
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
