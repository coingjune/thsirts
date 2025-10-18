import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import SellerRegisterPage from './pages/SellerRegisterPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import MyPage from './pages/MyPage';
import AuthModal from './components/AuthModal';

export interface User {
    name: string;
    email: string;
    is_seller?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const App: React.FC = () => {
    const [route, setRoute] = useState(window.location.hash.substr(1) || 'home');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [authModalType, setAuthModalType] = useState<'login' | 'signup'>('login');
    const [cartItemCount, setCartItemCount] = useState(0);

    // ✅ App.tsx 최상단 함수 내부에 추가
    const refreshUser = async () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Failed to refresh user info:', error);
        }
    };

    useEffect(() => {
        const handleHashChange = () => {
            setRoute(window.location.hash.substr(1) || 'home');
        };

        window.addEventListener('hashchange', handleHashChange);
        
        // 페이지 로드 시 저장된 토큰으로 사용자 정보 가져오기
        const token = sessionStorage.getItem('access_token');
        if (token) {
            fetchCurrentUser(token);
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // 사용자 로그인 상태가 변경되면 장바구니 개수 조회
    useEffect(() => {
        if (currentUser) {
            fetchCartCount();
        } else {
            setCartItemCount(0);
        }
    }, [currentUser]);

    const fetchCartCount = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCartItemCount(data.length);
            }
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
        }
    };

    const fetchCurrentUser = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            } else {
                // 토큰이 유효하지 않으면 삭제
                sessionStorage.removeItem('access_token');
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            sessionStorage.removeItem('access_token');
        }
    };

    const handleLogin = async (user: User & { password: string }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();
            
            // 토큰 저장
            sessionStorage.setItem('access_token', data.access_token);
            
            // 사용자 정보 설정
            setCurrentUser(data.user);
            setAuthModalOpen(false);
        } catch (error) {
            console.error('Login error:', error);
            alert(error instanceof Error ? error.message : 'Login failed');
            throw error;
        }
    };
    
    const handleSignup = async (user: User & { password: string }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    password: user.password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Signup failed');
            }

            const data = await response.json();
            
            // 토큰 저장
            sessionStorage.setItem('access_token', data.access_token);
            
            // 사용자 정보 설정
            setCurrentUser(data.user);
            setAuthModalOpen(false);
        } catch (error) {
            console.error('Signup error:', error);
            alert(error instanceof Error ? error.message : 'Signup failed');
            throw error;
        }
    };

    const handleLogout = () => {
        // 토큰 삭제
        sessionStorage.removeItem('access_token');
        setCurrentUser(null);
        setRoute('home');
        window.location.hash = 'home';
    };
    
    const openAuthModal = (type: 'login' | 'signup') => {
        setAuthModalType(type);
        setAuthModalOpen(true);
    };

    const renderPage = () => {
        if (route.startsWith('product/')) {
            const productId = route.split('/')[1];
            return <ProductDetailPage productId={productId} setRoute={setRoute} onCartUpdate={fetchCartCount} />;
        }
        switch (route) {
            case 'products':
                return <ProductsPage setRoute={setRoute} />;
            case 'cart':
                return <CartPage setRoute={setRoute} onCartUpdate={fetchCartCount} />;
            case 'order':
                return <OrderPage setRoute={setRoute} onCartUpdate={fetchCartCount}/>;
            case 'seller-register':
                return <SellerRegisterPage setRoute={setRoute} refreshUser={refreshUser}/>;
            case 'seller-dashboard':
                return <SellerDashboardPage setRoute={setRoute} />;
            case 'mypage':
                return <MyPage setRoute={setRoute} currentUser={currentUser} refreshUser={refreshUser}/>;
            case 'home':
            default:
                return <HomePage setRoute={setRoute} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar 
                setRoute={setRoute} 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                openAuthModal={openAuthModal}
                cartItemCount={cartItemCount}
            />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Footer />
            {isAuthModalOpen && (
                <AuthModal
                    type={authModalType}
                    onClose={() => setAuthModalOpen(false)}
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    switchType={(newType) => setAuthModalType(newType)}
                />
            )}
        </div>
    );
};

export default App;