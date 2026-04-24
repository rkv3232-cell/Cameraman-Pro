import { useContext, useState, FormEvent } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import LanguageContext from '../../context/LanguageContext';
import { text } from '../../utils/text';
import { sendWhatsAppReply } from '../../utils/whatsapp';

export const PublicEnquiry = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { lang } = useContext(LanguageContext);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        eventType: 'Wedding',
        date: '',
        location: '',
        message: ''
    });
    const [whatsappSent, setWhatsappSent] = useState(false);

    const sendCustomerWhatsApp = () => {
        if (whatsappSent || !formData.phone) {
            return false;
        }

        const sent = sendWhatsAppReply({
            name: formData.name || "Friend",
            phone: formData.phone,
            eventType: formData.eventType,
            date: formData.date,
            location: formData.location,
            message: formData.message
        });

        if (sent) {
            setWhatsappSent(true);
        }

        return sent;
    };

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Basic Phone Validation
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
            toast.error(text.enquiry.toast.invalidPhone[lang]);
            return;
        }

        if (!formData.name || !formData.date || !formData.location) {
            toast.error(text.enquiry.toast.missingFields[lang]);
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "enquiries"), {
                ...formData,
                phone: phoneDigits,
                status: 'new',
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            sendCustomerWhatsApp();
            toast.success(text.enquiry.toast.success[lang]);
        } catch (error) {
            console.error("Error submitting enquiry:", error);
            toast.error(text.enquiry.toast.error[lang]);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="pt-32 pb-20 min-h-screen bg-[var(--bg-primary)] flex justify-center items-center px-4">
                <div className="max-w-md w-full bg-[var(--surface-base)] rounded-3xl border border-[var(--border-light)] p-12 text-center shadow-2xl animate-scale-in">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">{text.enquiry.successTitle[lang]}</h2>
                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                        {text.enquiry.successSubtitle[lang]}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            onClick={sendCustomerWhatsApp}
                            disabled={whatsappSent}
                            className="px-6 py-3 font-semibold text-sm"
                        >
                            {whatsappSent
                                ? text.enquiry.whatsappSentLabel[lang]
                                : text.enquiry.whatsappButton[lang]
                            }
                        </Button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-8 py-3 bg-[var(--accent-primary)] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            {text.enquiry.successButton[lang]}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-20 min-h-full bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-16">
                    <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
                        {text.enquiry.badge[lang]}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6">
                        {text.enquiry.title[lang]}
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        {text.enquiry.subtitle[lang]}
                    </p>
                </div>

                <div className="max-w-3xl mx-auto bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Decorative gradient blur */}
                    <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-indigo-500/5 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                name="name"
                                label={text.enquiry.labels.name[lang]}
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={text.enquiry.placeholders.name[lang]}
                                required
                            />
                            <Input
                                name="phone"
                                label={text.enquiry.labels.phone[lang]}
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={text.enquiry.placeholders.phone[lang]}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">
                                    {text.enquiry.labels.eventType[lang]}
                                </label>
                                <select
                                    name="eventType"
                                    value={formData.eventType}
                                    onChange={handleChange}
                                    className="w-full h-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] appearance-none"
                                >
                                    <option value="Wedding">Wedding</option>
                                    <option value="Pre-Wedding">Pre-Wedding</option>
                                    <option value="Engagement">Engagement</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">
                                    {text.enquiry.labels.eventDate[lang]}
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] appearance-none"
                                />
                            </div>
                        </div>

                        <Input
                            name="location"
                            label={text.enquiry.labels.location[lang]}
                            value={formData.location}
                            onChange={handleChange}
                            placeholder={text.enquiry.placeholders.location[lang]}
                            required
                        />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                                <span>{text.enquiry.labels.message[lang]}</span>
                                <span className="text-[var(--text-tertiary)] italic">{text.enquiry.labels.optional[lang]}</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={4}
                                placeholder={text.enquiry.placeholders.message[lang]}
                                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
                            />
                        </div>

                        <div className="pt-6">
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full h-14 text-lg font-bold tracking-wide rounded-xl shadow-xl shadow-[var(--accent-primary)]/20 hover:shadow-[var(--accent-primary)]/40 hover:-translate-y-1 transition-all"
                            >
                                <span className="flex items-center gap-2">
                                    <Send size={20} />
                                    {text.enquiry.submitButton[lang]}
                                </span>
                            </Button>
                            <p className="text-center text-xs text-[var(--text-tertiary)] mt-4">
                                {text.enquiry.disclaimer[lang]}
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
