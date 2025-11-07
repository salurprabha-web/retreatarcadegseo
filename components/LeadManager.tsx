import React, { useState, useCallback, useEffect } from 'react';
import { Lead, LeadAnalysis } from '../types';
import { createClient } from '@/lib/supabase/client';
import { analyzeAndRespondToLead } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import Table from './common/Table';
import Loader from './common/Loader';
import TextArea from './common/TextArea';

// Fix: Instantiate Supabase client
const supabase = createClient();

const LeadStatusBadge: React.FC<{ status: Lead['status'] }> = ({ status }) => {
    const colorMap = {
        'New': 'bg-blue-500/20 text-blue-300',
        'Contacted': 'bg-purple-500/20 text-purple-300',
        'Qualified': 'bg-green-500/20 text-green-300',
        'Unqualified': 'bg-red-500/20 text-red-300',
        'Closed': 'bg-gray-500/20 text-gray-400',
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status]}`}>
            {status}
        </span>
    );
};

const LeadQualityBadge: React.FC<{ quality: LeadAnalysis['quality'] }> = ({ quality }) => {
    const colorMap = {
        'Hot': 'border-red-500 text-red-400',
        'Warm': 'border-yellow-500 text-yellow-400',
        'Cold': 'border-blue-500 text-blue-400',
    };
    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${colorMap[quality]}`}>
            {quality}
        </span>
    );
}

interface LeadManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const LeadManager: React.FC<LeadManagerProps> = ({ showToast }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).returns<Lead[]>();
        if (error) {
            showToast("Could not fetch leads.", 'error');
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);


    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
    };

    const handleUpdateLead = async (updatedLead: Lead) => {
        // Cast updatedLead to `any` to satisfy Supabase's Json type requirement for ai_analysis.
        const { error } = await supabase.from('leads').update(updatedLead as any).eq('id', updatedLead.id);
        if (error) {
            showToast(`Failed to update lead: ${error.message}`, 'error');
            console.error(error);
        } else {
            showToast('Lead updated successfully.', 'success');
            setLeads(prevLeads => prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l));
            if (selectedLead && selectedLead.id === updatedLead.id) {
                setSelectedLead(updatedLead);
            }
        }
    };

    const closeModal = () => {
        setSelectedLead(null);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Lead Manager</h1>
            <p className="text-gray-400 mb-8">
                Analyze, qualify, and respond to incoming leads with an AI assistant.
            </p>

            <Card title="Lead Inbox">
                {loading ? <div className="flex justify-center py-8"><Loader /></div> :
                    <Table<Lead>
                        headers={['Sender', 'Subject', 'Date', 'Status', 'AI Quality']}
                        data={leads}
                        renderRow={(lead) => (
                            <tr key={lead.id} className="border-b border-gray-700 hover:bg-brand-secondary cursor-pointer" onClick={() => handleSelectLead(lead)}>
                                <td className="p-4 font-medium">{lead.sender_name}<br/><span className="text-xs text-gray-500">{lead.sender_email}</span></td>
                                <td className="p-4 text-gray-400">{lead.subject}</td>
                                <td className="p-4 text-gray-400">{lead.received_date}</td>
                                <td className="p-4"><LeadStatusBadge status={lead.status} /></td>
                                <td className="p-4">
                                    {lead.ai_analysis ? <LeadQualityBadge quality={lead.ai_analysis.quality} /> : <span className="text-xs text-gray-500">Not Analyzed</span>}
                                </td>
                            </tr>
                        )}
                    />
                }
            </Card>

            {selectedLead && (
                 <LeadDetailModal
                    lead={selectedLead}
                    onClose={closeModal}
                    onUpdate={handleUpdateLead}
                    showToast={showToast}
                />
            )}
        </div>
    );
};


interface LeadDetailModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (lead: Lead) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate, showToast }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [replyText, setReplyText] = useState(lead.ai_analysis?.suggestedReply || '');

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fullMessage = `From: ${lead.sender_name} <${lead.sender_email}>\nSubject: ${lead.subject}\n\n${lead.message}`;
            const analysis = await analyzeAndRespondToLead(fullMessage);
            onUpdate({ ...lead, ai_analysis: analysis });
            setReplyText(analysis.suggestedReply);
        } catch (err: any) {
            setError(err.message || "Failed to analyze lead.");
        } finally {
            setIsLoading(false);
        }
    }, [lead, onUpdate]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ ...lead, status: e.target.value as Lead['status'] });
    };

    const handleSendReply = () => {
        console.log("Sending reply:", replyText);
        onUpdate({ ...lead, status: 'Contacted' });
        showToast("Reply sent! (Logged to console)", 'success');
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Lead from ${lead.sender_name}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh]">
                {/* Left: Original Message */}
                <div className="space-y-4 overflow-y-auto pr-2">
                    <h3 className="text-lg font-semibold text-gray-200">Original Message</h3>
                    <div>
                        <p className="text-sm text-gray-400">From: <span className="text-gray-200">{lead.sender_name} &lt;{lead.sender_email}&gt;</span></p>
                        <p className="text-sm text-gray-400">Subject: <span className="text-gray-200">{lead.subject}</span></p>
                    </div>
                    <div className="p-4 bg-brand-dark rounded-md border border-gray-700">
                        <p className="text-gray-300 whitespace-pre-wrap">{lead.message}</p>
                    </div>
                </div>

                {/* Right: AI Assistant */}
                <div className="space-y-4 overflow-y-auto pr-2">
                    <h3 className="text-lg font-semibold text-gray-200">AI Assistant</h3>
                    {!lead.ai_analysis && !isLoading && (
                        <div className="text-center p-8 bg-brand-dark rounded-md">
                            <p className="text-gray-400 mb-4">This lead has not been analyzed yet.</p>
                            <Button onClick={handleAnalyze} isLoading={isLoading} className="w-auto">✨ Analyze with AI</Button>
                        </div>
                    )}
                    {isLoading && <div className="flex justify-center p-8"><Loader /></div>}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    
                    {lead.ai_analysis && (
                        <div className="space-y-4">
                            <div className="p-4 bg-brand-dark rounded-md border border-gray-700 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-300">Analysis</h4>
                                    <LeadQualityBadge quality={lead.ai_analysis.quality} />
                                </div>
                                <p className="text-sm text-gray-400 italic">"{lead.ai_analysis.summary}"</p>
                                <p className="text-sm text-gray-400">Intent: <span className="font-medium text-gray-200">{lead.ai_analysis.intent}</span></p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-300 mb-2">Suggested Reply</h4>
                                <TextArea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={8} />
                                <div className="flex gap-2 mt-2">
                                     <Button onClick={handleSendReply} className="w-auto text-sm py-2">Send Reply</Button>
                                     <Button onClick={handleAnalyze} isLoading={isLoading} className="w-auto text-sm py-2 bg-gray-600 hover:bg-gray-500">
                                        {isLoading ? '...' : 'Regenerate'}
                                     </Button>
                                </div>
                            </div>

                             <div>
                                <label htmlFor="status-select" className="block text-sm font-medium text-gray-300 mb-1">
                                    Manual Status
                                </label>
                                <select
                                    id="status-select"
                                    value={lead.status}
                                    onChange={handleStatusChange}
                                    className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                                >
                                    <option>New</option>
                                    <option>Contacted</option>
                                    <option>Qualified</option>
                                    <option>Unqualified</option>
                                    <option>Closed</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
                <Button type="button" onClick={onClose} className="w-auto">Close</Button>
            </div>
        </Modal>
    );
};

export default LeadManager;