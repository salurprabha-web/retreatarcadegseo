'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mail, Phone, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ContactClientProps {
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

export function ContactClient({ contactInfo }: ContactClientProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    event_type: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ✅ FIX: this now actually saves the enquiry — previously it just
    // waited 1 second and showed a fake success message, discarding
    // every submission with nowhere for it to go.
    const { error } = await supabase.from('contact_enquiries').insert([{
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      event_type: formData.event_type,
      message: formData.message,
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      console.error('Enquiry submission error:', error);
      toast.error('Something went wrong. Please WhatsApp us directly at +91 9063679687.');
      setIsSubmitting(false);
      return;
    }

    toast.success("Thanks! We've received your enquiry and will respond within a few hours.");
    setFormData({ name: '', email: '', phone: '', event_type: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Send Us a Message</h2>
          <p className="text-gray-500 text-sm mb-6">
            Fill out the form below and we'll get back to you with a custom quote.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <Input id="event_type" name="event_type" value={formData.event_type} onChange={handleChange} placeholder="e.g. Corporate Annual Day, Wedding" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Tell us about your event *</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Event date, venue, expected guest count, and what you're looking for (photo booths, VR, games, team building...)"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Send Message</>
              )}
            </Button>
          </form>
        </div>

        {/* ── Sidebar — dark, matches brand ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-[#07091a] rounded-3xl p-6 border border-white/10">
            <h3 className="text-white font-bold mb-5">Get in Touch</h3>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Email</p>
                  <a href={`mailto:${contactInfo.email}`} className="text-sm text-white hover:text-orange-400 transition break-all">
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Phone</p>
                  <a href={`tel:${contactInfo.phone}`} className="text-sm text-white hover:text-orange-400 transition">
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Location</p>
                  <p className="text-sm text-white">{contactInfo.address}</p>
                  <p className="text-xs text-white/40 mt-1">Mon–Sun · 9am–9pm</p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/917993912762"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-xl transition mt-6 text-sm"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us — Fastest Response
            </a>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Why Retreat Arcade</p>
            <ul className="space-y-2.5">
              {[
                "Same-day quotes — usually within hours",
                "65+ products — largest catalogue in Hyderabad",
                "Full setup, operator and dismantling included",
                "Pan India delivery — 20+ cities",
              ].map((item) => (
                <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
