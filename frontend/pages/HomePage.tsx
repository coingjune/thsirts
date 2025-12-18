import React from 'react';
import { useTranslation } from 'react-i18next';

interface HomePageProps {
    setRoute: (route: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setRoute }) => {
    const { t } = useTranslation();

    return (
        <div className="relative h-[calc(100vh-4rem)] bg-cover bg-center" style={{ backgroundImage: "url('/mainbackground.png')" }}>
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                    {t('home.title')}
                </h1>
                <p className="max-w-2xl text-lg md:text-xl text-gray-200 mb-8">
                    {t('home.subtitle')}
                </p>
                <a
                    href="#products"
                    onClick={(e) => {
                        e.preventDefault();
                        setRoute('products');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    {t('home.cta')}
                </a>
            </div>
        </div>
    );
};

export default HomePage;
