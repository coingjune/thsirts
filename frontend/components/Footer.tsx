import React from 'react';

const Footer: React.FC = () => (
    <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; {new Date().getFullYear()} Whale.June Studio. All rights reserved.</p>
        </div>
    </footer>
);

export default Footer;
