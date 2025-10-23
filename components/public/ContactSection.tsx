
import React from 'react';

const ContactSection: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message! We'll be in touch shortly.");
    // Here you would typically handle form submission
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section id="contact" className="py-20 bg-brand-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white font-poppins">Let's Plan Your Event</h2>
          <p className="text-lg text-gray-400 mt-2">Get in touch for a custom quote and availability.</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Your Name" required className="w-full px-4 py-3 bg-brand-dark text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent" />
              <input type="email" placeholder="Your Email" required className="w-full px-4 py-3 bg-brand-dark text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <input type="text" placeholder="Event Type (e.g., Wedding, Corporate)" className="w-full px-4 py-3 bg-brand-dark text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            <textarea placeholder="Tell us about your event..." rows={5} required className="w-full px-4 py-3 bg-brand-dark text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"></textarea>
            <div className="text-center">
              <button type="submit" className="bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-accent-hover transition-colors duration-300">
                Send Inquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
