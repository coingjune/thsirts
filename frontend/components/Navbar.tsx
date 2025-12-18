import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface User {
    name: string;
    email: string;
    is_seller?: number;
}

interface NavbarProps {
    setRoute: (route: string) => void;
    currentUser: User | null;
    onLogout: () => void;
    openAuthModal: (type: 'login' | 'signup') => void;
    cartItemCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ setRoute, currentUser, onLogout, openAuthModal, cartItemCount = 0 }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const next = i18n.language === 'ko' ? 'en' : 'ko';
        i18n.changeLanguage(next);
    };

    const handleNavigation = (e: React.MouseEvent, route: string) => {
        e.preventDefault();
        setRoute(route);
        window.location.hash = route;
        setIsMobileMenuOpen(false); // 메뉴 클릭 시 모바일 메뉴 닫기
    };

    const handleLogout = () => {
        onLogout();
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* 로고 */}
                    <div className="flex items-center">
                        <a 
                            href="#home" 
                            onClick={(e) => handleNavigation(e, 'home')} 
                            className="text-2xl font-bold text-gray-900 tracking-tight"
                        >
                            {t('brand')}
                        </a>
                    </div>

                    {/* 데스크톱 메뉴 */}
                    <div className="hidden md:flex items-center space-x-4">
                        <a 
                            href="#home" 
                            onClick={(e) => handleNavigation(e, 'home')} 
                            className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            {t('nav.home')}
                        </a>
                        <a 
                            href="#products" 
                            onClick={(e) => handleNavigation(e, 'products')} 
                            className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            {t('nav.products')}
                        </a>
                        {currentUser && (
                            <a 
                                href="#mypage" 
                                onClick={(e) => handleNavigation(e, 'mypage')} 
                                className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                {t('nav.mypage')}
                            </a>
                        )}

                        {/* 사용자 메뉴 */}
                        {currentUser ? (
                            <>
                                <span className="text-sm text-gray-700 hidden lg:block">
                                    {t('nav.greeting', { name: currentUser.name })}
                                </span>
                                <button 
                                    onClick={handleLogout} 
                                    className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    {t('nav.logout', '로그아웃')}
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => openAuthModal('login')} 
                                    className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    {t('nav.login')}
                                </button>
                                <button 
                                    onClick={() => openAuthModal('signup')} 
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    {t('nav.signup')}
                                </button>
                            </>
                        )}

                        {/* 언어 전환 토글 */}
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100"
                            aria-label="Change language"
                        >
                            {i18n.language === 'ko' ? 'EN' : 'KO'}
                        </button>

                        {/* 장바구니 아이콘 */}
                        {currentUser && (
                            <button 
                                onClick={(e) => handleNavigation(e, 'cart')}
                                className="relative p-2 text-gray-600 hover:text-gray-900"
                                aria-label="장바구니"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>

                    {/* 모바일 햄버거 버튼 + 장바구니 */}
                    <div className="md:hidden flex items-center space-x-2">
                        {/* 모바일 언어 전환 토글 */}
                        <button
                            onClick={toggleLanguage}
                            className="px-2 py-1 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100"
                            aria-label="Change language"
                        >
                            {i18n.language === 'ko' ? 'EN' : 'KO'}
                        </button>

                        {/* 모바일 장바구니 아이콘 */}
                                        {currentUser && (
                            <button 
                                onClick={(e) => handleNavigation(e, 'cart')}
                                className="relative p-2 text-gray-600 hover:text-gray-900"
                                aria-label="장바구니"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* 햄버거 메뉴 버튼 */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            aria-expanded={isMobileMenuOpen}
                            aria-label="메뉴 열기"
                        >
                            {isMobileMenuOpen ? (
                                // X 아이콘
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                // 햄버거 아이콘
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 모바일 메뉴 (슬라이드 다운) */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {/* 사용자 정보 (로그인 시) */}
                        {currentUser && (
                            <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-200 mb-2">
                                {t('nav.greeting', { name: currentUser.name })}
                            </div>
                        )}

                        {/* 메뉴 아이템들 */}
                        <a
                            href="#home"
                            onClick={(e) => handleNavigation(e, 'home')}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        >
                            {t('nav.home')}
                        </a>
                        <a
                            href="#products"
                            onClick={(e) => handleNavigation(e, 'products')}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        >
                            {t('nav.products')}
                        </a>

                        {currentUser ? (
                            <>
                                <a
                                    href="#mypage"
                                    onClick={(e) => handleNavigation(e, 'mypage')}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    👤 {t('nav.mypage')}
                                </a>
                                <a
                                    href="#cart"
                                    onClick={(e) => handleNavigation(e, 'cart')}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    {t('nav.cart')} {cartItemCount > 0 && (
                                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full ml-2">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </a>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    {t('nav.logout', '로그아웃')}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        openAuthModal('login');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => {
                                        openAuthModal('signup');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    {t('nav.signup')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;