import React from 'react';

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
    const handleNavigation = (e: React.MouseEvent, route: string) => {
        e.preventDefault();
        setRoute(route);
        window.location.hash = route;
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <a href="#home" onClick={(e) => handleNavigation(e, 'home')} className="text-2xl font-bold text-gray-900 tracking-tight">
                            T-Style
                        </a>
                    </div>
                    <div className="flex items-center">
                        <div className="hidden md:flex items-baseline space-x-4">
                            <a href="#home" onClick={(e) => handleNavigation(e, 'home')} className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">메인</a>
                            <a href="#products" onClick={(e) => handleNavigation(e, 'products')} className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">제품</a>
                            {currentUser && (
                                <a href="#mypage" onClick={(e) => handleNavigation(e, 'mypage')} className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">마이페이지</a>
                            )}
                        </div>
                        <div className="ml-4 flex items-center space-x-4">
                            {currentUser ? (
                                <>
                                    <span className="text-sm text-gray-700 hidden sm:block">안녕하세요, {currentUser.name}님!</span>
                                    <button onClick={onLogout} className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">로그아웃</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => openAuthModal('login')} className="text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">로그인</button>
                                    <button onClick={() => openAuthModal('signup')} className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">회원가입</button>
                                </>
                            )}
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
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;