import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: string;
        image_url: string;
        seller?: { id: number; name: string };
    };
}

interface CartPageProps {
    setRoute: (route: string) => void;
    onCartUpdate?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CartPage: React.FC<CartPageProps> = ({ setRoute, onCartUpdate }) => {
    const { t } = useTranslation();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        if (cartItems.length > 0) {
            setSelectedItems(cartItems.map(item => item.id));
        }
    }, [cartItems]);

    const fetchCart = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                setError(t('productDetail.loginRequired'));
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(t('common.error'));
            }

            const data = await response.json();
            setCartItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (itemId: number) => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(t('common.error'));
            }

            setCartItems(cartItems.filter(item => item.id !== itemId));
            setSelectedItems(selectedItems.filter(id => id !== itemId));
            if (onCartUpdate) {
                onCartUpdate();
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
        }
    };

    const updateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(itemId);
            return;
        }

        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/cart/${itemId}?quantity=${newQuantity}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(t('common.error'));
            }

            setCartItems(cartItems.map(item => 
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
        }
    };

    const toggleSelectItem = (itemId: number) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === cartItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cartItems.map(item => item.id));
        }
    };

    const handleOrder = () => {
        if (selectedItems.length === 0) {
            alert(t('cart.selectItems') || '주문할 상품을 선택해주세요.');
            return;
        }
        
        const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
        sessionStorage.setItem('orderItems', JSON.stringify(selectedCartItems));
        
        setRoute('order');
        window.location.hash = 'order';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('cart.loading') || t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 text-lg">{error}</p>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">{t('cart.empty')}</h2>
                    <p className="mt-2 text-gray-600">{t('cart.emptyDescription') || '상품을 장바구니에 추가해보세요!'}</p>
                    <button
                        onClick={() => setRoute('products')}
                        className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                    >
                        {t('cart.shopNow')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">{t('cart.title')}</h1>
                
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                        {t('cart.selectAll') || '전체 선택'} ({selectedItems.length}/{cartItems.length})
                    </label>
                </div>

                <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => toggleSelectItem(item.id)}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <img 
                                src={item.product.image_url.startsWith('http') 
                                    ? item.product.image_url 
                                    : `${API_BASE_URL}${item.product.image_url}`
                                }
                                alt={item.product.name}
                                className="w-24 h-24 object-cover rounded-md"
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                                <p className="text-gray-600">{item.product.price}</p>
                                {item.product.seller && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {t('cart.seller', { name: item.product.seller.name })}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                    -
                                </button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600 hover:text-red-800 px-4 py-2"
                            >
                                {t('cart.delete')}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={() => setRoute('products')}
                        className="text-indigo-600 hover:text-indigo-800"
                    >
                        ← {t('cart.continueShopping') || '쇼핑 계속하기'}
                    </button>
                    <button 
                        onClick={handleOrder}
                        disabled={selectedItems.length === 0}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {t('cart.checkout')} ({selectedItems.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;