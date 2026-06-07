import { useState, useRef, ChangeEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { 
    FileText, Image as ImageIcon, Sparkles, User, Phone, 
    Calendar, MapPin, IndianRupee, Package, Edit, CheckCircle2,
    Info, CheckCircle, X
} from "lucide-react";
import { parseBookingText, parseBookingImage } from "../../lib/openrouter";
import toast from "react-hot-toast";

interface SmartBookingImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export const SmartBookingImportModal = ({ isOpen, onClose, onSuccess }: SmartBookingImportModalProps) => {
    const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (activeTab === 'text' && !inputText.trim()) {
            toast.error("Please paste some text first.");
            return;
        }
        if (activeTab === 'image' && !selectedImage) {
            toast.error("Please upload an image first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            let data;
            if (activeTab === 'text') {
                data = await parseBookingText(inputText);
            } else {
                // Convert image to base64
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        // Extract just the base64 part
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                });
                reader.readAsDataURL(selectedImage!);
                const base64Data = await base64Promise;
                data = await parseBookingImage(base64Data, selectedImage!.type);
            }
            
            setExtractedData(data);
            toast.success("Details extracted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze. Please try again or fill manually.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreateBooking = () => {
        if (!extractedData) return;
        onSuccess(extractedData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Smart Booking Import" maxWidth="max-w-5xl">
            <div className="flex flex-col md:flex-row h-full">
                
                {/* Left Side: Input */}
                <div className="flex-1 p-6 border-r border-[var(--border-light)] bg-[var(--surface-base)] flex flex-col h-full">
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                        Paste booking details or upload an image. AI will extract the information and fill the form.
                    </p>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border-light)] mb-6">
                        <button 
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'text' ? 'border-purple-600 text-purple-600' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            onClick={() => setActiveTab('text')}
                        >
                            <FileText size={18} /> Paste Text
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'image' ? 'border-purple-600 text-purple-600' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            onClick={() => setActiveTab('image')}
                        >
                            <ImageIcon size={18} /> Upload Image
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 flex flex-col">
                        {activeTab === 'text' ? (
                            <div className="flex-1 flex flex-col mb-6">
                                <textarea 
                                    className="flex-1 w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none min-h-[250px]"
                                    placeholder="Paste booking details here..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                ></textarea>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-[var(--border-light)] rounded-2xl bg-white dark:bg-[var(--bg-secondary)] mb-6 p-8 text-center relative overflow-hidden">
                                {imagePreview ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain p-2" />
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button 
                                                className="px-4 py-2 bg-white/90 backdrop-blur text-rose-600 rounded-lg shadow font-medium text-sm hover:bg-white"
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-5">
                                            <ImageIcon size={48} className="text-slate-500 dark:text-[var(--text-secondary)] stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-800 dark:text-[var(--text-primary)] mb-2">Upload Image</h3>
                                        <p className="text-[15px] text-slate-500 dark:text-[var(--text-secondary)] mb-6">Upload a screenshot of WhatsApp chat or invoice</p>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                        />
                                        <button 
                                            className="px-6 py-2.5 bg-white dark:bg-[var(--surface-base)] border border-slate-200 dark:border-[var(--border-light)] text-slate-700 dark:text-[var(--text-primary)] font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[var(--bg-secondary)] transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Choose File
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tips */}
                        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-medium mb-3">
                                <Info size={16} /> Tips for better results:
                            </div>
                            <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="mt-0.5 text-purple-500 shrink-0" />
                                    Include labels like Name, Phone, Date, Event etc.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="mt-0.5 text-purple-500 shrink-0" />
                                    You can copy details from WhatsApp or any document
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="mt-0.5 text-purple-500 shrink-0" />
                                    Image upload works best with clear text
                                </li>
                            </ul>
                        </div>

                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl py-4 flex items-center justify-center gap-2 text-base font-semibold"
                            onClick={handleAnalyze}
                            isLoading={isAnalyzing}
                            disabled={(activeTab === 'text' && !inputText.trim()) || (activeTab === 'image' && !selectedImage)}
                        >
                            <Sparkles size={20} /> Analyze Booking Details
                        </Button>
                    </div>
                </div>

                {/* Right Side: Preview */}
                <div className="flex-1 p-6 bg-[var(--bg-secondary)] flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[var(--text-primary)] text-lg">Extracted Details (Preview)</h3>
                        <div className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold">
                            <Sparkles size={14} /> AI Preview
                        </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Please review the details before creating booking</p>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-6">
                        {!extractedData && !isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] p-10 text-center">
                                <Sparkles size={48} className="mb-4 opacity-50" />
                                <p>Click on Analyze to see extracted details here</p>
                            </div>
                        )}
                        
                        {isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-indigo-500 p-10 text-center">
                                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                <p className="font-medium animate-pulse">Extracting details with AI...</p>
                            </div>
                        )}

                        {extractedData && !isAnalyzing && (
                            <>
                                <PreviewField icon={User} label="Client Name" value={extractedData.clientName} iconColor="text-indigo-600 bg-indigo-100 dark:bg-indigo-500/20" />
                                <PreviewField icon={Phone} label="Phone" value={extractedData.clientPhone} iconColor="text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20" />
                                <PreviewField icon={Calendar} label="Event Type" value={extractedData.eventType} iconColor="text-amber-600 bg-amber-100 dark:bg-amber-500/20" />
                                <PreviewField icon={Calendar} label="Event Date" value={extractedData.eventDate} iconColor="text-blue-600 bg-blue-100 dark:bg-blue-500/20" />
                                <PreviewField icon={MapPin} label="Location" value={extractedData.venue} iconColor="text-rose-600 bg-rose-100 dark:bg-rose-500/20" />
                                <PreviewField icon={IndianRupee} label="Advance Paid" value={extractedData.advancePaid ? `₹${extractedData.advancePaid}` : null} iconColor="text-green-600 bg-green-100 dark:bg-green-500/20" />
                                <PreviewField icon={Package} label="Package" value={extractedData.package} iconColor="text-purple-600 bg-purple-100 dark:bg-purple-500/20" />
                                <PreviewField icon={FileText} label="Notes" value={extractedData.notes} iconColor="text-orange-600 bg-orange-100 dark:bg-orange-500/20" />
                            </>
                        )}
                    </div>

                    <div className="pt-4 border-t border-[var(--border-light)] flex gap-4 mt-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 py-3.5 bg-white dark:bg-[var(--surface-base)] border border-[var(--border-light)] flex items-center justify-center gap-2 font-semibold text-[var(--text-primary)] rounded-xl"
                            disabled={!extractedData || isAnalyzing}
                            onClick={() => handleCreateBooking()}
                        >
                            <Edit size={18} /> Edit Details
                        </Button>
                        <Button 
                            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 font-semibold"
                            disabled={!extractedData || isAnalyzing}
                            onClick={handleCreateBooking}
                        >
                            <CheckCircle2 size={18} /> Create Booking
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const PreviewField = ({ icon: Icon, label, value, iconColor }: { icon: any, label: string, value: string | null, iconColor: string }) => {
    return (
        <div className="flex items-center gap-4 p-4 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-secondary)] font-medium mb-0.5">{label}</p>
                <p className="text-base font-semibold text-[var(--text-primary)] truncate">
                    {value || <span className="text-[var(--text-tertiary)] italic">Not found</span>}
                </p>
            </div>
            <div className="w-8 flex items-center justify-center">
                {value ? (
                    <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                    <X size={20} className="text-[var(--text-tertiary)] opacity-50" />
                )}
            </div>
        </div>
    );
};
