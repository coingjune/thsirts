import React, { useState, useEffect } from 'react';

interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: string;
        image_url: string;
        external_store_url?: string;
    };
}

interface CartPageProps {
    setRoute: (route: string) => void;
    onCartUpdate?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CartPage: React.FC<CartPageProps> = ({ setRoute, onCartUpdate }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                setError('로그인이 필요합니다.');
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('장바구니를 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            setCartItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
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
                throw new Error('삭제에 실패했습니다.');
            }

            // 로컬 상태 업데이트
            setCartItems(cartItems.filter(item => item.id !== itemId));
            setSelectedItems(selectedItems.filter(id => id !== itemId));
            // 부모 컴포넌트에 업데이트 알림
            if (onCartUpdate) {
                onCartUpdate();
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
    };

    const updateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/cart/${itemId}?quantity=${newQuantity}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('수량 변경에 실패했습니다.');
            }

            // 로컬 상태 업데이트
            setCartItems(cartItems.map(item => 
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
    };

    const handleOrderItem = (item: CartItem) => {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!item.product.external_store_url) {
            alert('이 상품에는 외부 스토어 링크가 설정되지 않았습니다.\n판매자에게 문의해주세요.');
            return;
        }

        // 각 상품별 외부 스토어 링크로 바로 이동
        window.open(item.product.external_store_url, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">장바구니를 불러오는 중...</p>
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
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">장바구니가 비어있습니다</h2>
                    <p className="mt-2 text-gray-600">상품을 장바구니에 추가해보세요!</p>
                    <button
                        onClick={() => setRoute('products')}
                        className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                    >
                        쇼핑 계속하기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">장바구니</h1>
                <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
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
                            </div>
                            <div className="flex flex-col items-end gap-2">
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOrderItem(item)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
                                    >
                                        주문하기
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-600 hover:text-red-800 px-4 py-2 text-sm"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-start items-center">
                    <button
                        onClick={() => setRoute('products')}
                        className="text-indigo-600 hover:text-indigo-800"
                    >
                        ← 쇼핑 계속하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;