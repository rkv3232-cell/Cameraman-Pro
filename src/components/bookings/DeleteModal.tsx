import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
    title: string;
    description: string;
}

export const DeleteModal = ({ isOpen, onClose, onConfirm, isLoading, title, description }: DeleteModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action">
            <div className="flex flex-col items-center text-center p-4">
                <div className="p-3 bg-red-500/10 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 mb-6">{description}</p>

                <div className="flex gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm} isLoading={isLoading} className="flex-1">
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
