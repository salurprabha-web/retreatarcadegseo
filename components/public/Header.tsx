import React, { useState } from 'react';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const allLinks = [
        { name: 'Services', href: '#/services'},
        { name: 'Blog', href: '#/blog'},
        { name: 'Gallery', href: '#/gallery' },
        { name: 'Testimonials', href: '#/testimonials' },
        { name: 'Contact', href: '#/contact' },
    ];

    const handleNavigate = (hash: string, isMobile: boolean = false) => {
        window.location.hash = hash;
        if (isMobile) {
            setIsMenuOpen(false);
        }
    };

    return (
        <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <button onClick={() => handleNavigate('#/')} className="flex items-center text-left focus:outline-none">
                     <h1 className="text-2xl font-bold text-brand-accent font-poppins">Retreat</h1>
                     <h1 className="text-2xl font-bold text-white font-poppins ml-1">Arcade</h1>
                </button>

                {/* Desktop Nav */}
                <nav className="hidden md:flex space-x-8">
                    {allLinks.map(link => (
                        <button 
                            key={link.name} 
                            onClick={() => handleNavigate(link.href)} 
                            className="text-gray-300 hover:text-brand-accent transition-colors duration-200 font-medium"
                        >
                            {link.name}
                        </button>
                    ))}
                </nav>

                {/* Mobile Nav Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
                        </svg>
                    </button>
                </div>
            </div>
             {/* Mobile Nav Menu */}
            {isMenuOpen && (
                 <div className="md:hidden">
                    <nav className="px-6 pt-2 pb-4 flex flex-col space-y-2">
                         {allLinks.map(link => (
                            <button 
                                key={link.name} 
                                onClick={() => handleNavigate(link.href, true)}
                                className="text-gray-300 hover:text-brand-accent transition-colors duration-200 font-medium py-2 text-center bg-brand-secondary rounded-md"
                            >
                                {link.name}
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;