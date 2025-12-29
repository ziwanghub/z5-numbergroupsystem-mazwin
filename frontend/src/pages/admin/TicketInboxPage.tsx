
import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, Send, Lock, User, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { toast } from 'sonner';

interface Message {
    senderName: string;
    content: string;
    timestamp: string;
    isInternal: boolean;
}

interface Ticket {
    _id: string;
    title: string;
    description: string;
    category: string;
    severity: string;
    status: string;
    messages: Message[];
    createdAt: string;
    userId: { username: string; email: string };
    snapshot?: any;
}

export default function TicketInboxPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyContent, setReplyContent] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setIsLoading(true);
            const data = await ticketService.getMyTickets();
            if (data.tickets) {
                setTickets(data.tickets);
            }
        } catch (error) {
            toast.error("Failed to load tickets");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyContent.trim()) return;

        try {
            setIsSending(true);
            const response = await ticketService.replyTicket(selectedTicket._id, replyContent, isInternalNote);

            // Update local state
            const updatedTicket = response.ticket;
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            setSelectedTicket(updatedTicket);

            setReplyContent("");
            toast.success(isInternalNote ? "Note added" : "Reply sent");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reply");
        } finally {
            setIsSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'IN_PROGRESS': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'RESOLVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'CLOSED': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* TICKET LIST - Left Pane */}
            <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-500" />
                        Inbox
                    </h2>
                    <button onClick={loadTickets} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {tickets.length === 0 && !isLoading && (
                        <div className="text-center p-8 text-slate-500 text-sm">No tickets found.</div>
                    )}
                    {tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-slate-600 ${selectedTicket?._id === ticket._id
                                    ? 'bg-slate-800/80 border-amber-500/50 shadow-sm'
                                    : 'bg-slate-950/30 border-slate-800 hover:bg-slate-800/30'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-white truncate mb-1">{ticket.title}</h3>
                            <p className="text-xs text-slate-400 truncate">{ticket.description}</p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                                <User className="w-3 h-3" />
                                {ticket.userId?.username || 'Unknown'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MESSAGE THREAD - Right Pane */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                {selectedTicket ? (
                    <>
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-800 bg-slate-950/30">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-2">{selectedTicket.title}</h1>
                                    <div className="flex items-center gap-3 text-sm text-slate-400">
                                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(selectedTicket.status)}`}>
                                            {selectedTicket.status}
                                        </span>
                                        <span>•</span>
                                        <span className="text-amber-500 font-medium">#{selectedTicket._id.slice(-6)}</span>
                                        <span>•</span>
                                        <span>{selectedTicket.category}</span>
                                    </div>
                                </div>
                                {selectedTicket.snapshot && (
                                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
                                        Active Context Available
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                                {selectedTicket.description}
                            </p>
                        </div>

                        {/* Thread */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20">
                            {selectedTicket.messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.isInternal ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-xl p-4 border ${msg.isInternal
                                            ? 'bg-amber-950/20 border-amber-900/30 text-amber-100 rounded-tr-sm'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-200 rounded-tl-sm'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                                            <span className="font-bold">{msg.senderName}</span>
                                            {msg.isInternal && <span className="flex items-center gap-1 text-amber-500"><Lock className="w-3 h-3" /> Internal Note</span>}
                                            <span>•</span>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900">
                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-slate-600 resize-none"
                                />
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isInternalNote}
                                            onChange={(e) => setIsInternalNote(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                                        />
                                        <Lock className="w-3 h-3" />
                                        Internal Note (User won't see this)
                                    </label>
                                    <button
                                        onClick={handleReply}
                                        disabled={isSending || !replyContent.trim()}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Mail className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}
