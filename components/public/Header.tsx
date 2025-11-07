'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const allLinks = [
        { name: 'Services', href: '/services'},
        { name: 'Blog', href: '/blog'},
        { name: 'Gallery', href: '/#gallery' },
        { name: 'Testimonials', href: '/#testimonials' },
        { name: 'Contact', href: '/#contact' },
    ];

    const handleMobileNavClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center text-left focus:outline-none">
                     <h1 className="text-2xl font-bold text-brand-accent font-poppins">Retreat</h1>
                     <h1 className="text-2xl font-bold text-white font-poppins ml-1">Arcade</h1>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex space-x-8">
                    {allLinks.map(link => (
                        <Link 
                            key={link.name} 
                            href={link.href} 
                            className="text-gray-300 hover:text-brand-accent transition-colors duration-200 font-medium"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Nav Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
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
                            <Link 
                                key={link.name} 
                                href={link.href}
                                onClick={handleMobileNavClick}
                                className="text-gray-300 hover:text-brand-accent transition-colors duration-200 font-medium py-2 text-center bg-brand-secondary rounded-md"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
