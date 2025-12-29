
import React, { useState } from 'react';
import { X, Loader2, Bug, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ticketService } from '../../services/ticketService';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    snapshot?: any; // Context data (inputs, outputs)
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, snapshot }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: snapshot?.title || '', // Pre-fill title if available
        description: '',
        category: 'BUG', // Default
        severity: 'MEDIUM'
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await ticketService.createTicket({
                ...formData,
                snapshot: snapshot // Attach context automatically
            });

            toast.success("Issue Reported Successfully");
            setFormData({ title: '', description: '', category: 'BUG', severity: 'MEDIUM' }); // Reset
            onClose();
        } catch (error: any) {
            console.error("Report Failed:", error);
            toast.error(error.message || "Failed to submit report");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bug className="w-5 h-5 text-red-500" />
                        Report an Issue
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Context alert */}
                {snapshot && (
                    <div className="px-6 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-3">
                        <Save className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-300">
                            Calculation Context (Inputs/Formula) will be attached automatically.
                        </span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Subject</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Calculation result is incorrect"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                        />
                    </div>

                    {/* Category & Severity Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Category</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
                                >
                                    <option value="BUG">Bug / Error</option>
                                    <option value="CALCULATION_ERROR">Calculation Wrong</option>
                                    <option value="FEATURE">Feature Request</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Severity</label>
                            <select
                                name="severity"
                                value={formData.severity}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Describe what happened..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600 resize-none"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ReportIssueModal;
