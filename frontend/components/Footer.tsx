import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();
    const year = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
                <p>{t('footer.copyright', { year })}</p>
            </div>
        </footer>
    );
};

export default Footer;
