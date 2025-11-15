import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface User {
    name: string;
    email: string;
    is_seller?: number;
}

interface MyPageProps {
    setRoute: (route: string) => void;
    currentUser: User | null;
    refreshUser: () => Promise<void>;
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    items: Array<{
        product: { name: string; price: string; image_url: string };
        quantity: number;
    }>;
    seller: { name: string };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE = 5;

const MyPage: React.FC<MyPageProps> = ({ setRoute, currentUser, refreshUser }) => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (currentUser) {
            fetchOrders();
        }
    }, [currentUser]);

    const fetchOrders = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'pending': t('mypage.statusPending'),
            'completed': t('mypage.statusCompleted'),
            'shipping': t('mypage.statusShipping'),
            'delivered': t('mypage.statusDelivered'),
            'cancelled': t('mypage.statusCancelled'),
            'refund_requested': t('mypage.statusRefundRequested'),
            'refund_completed': t('mypage.statusRefundCompleted')
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colorMap: { [key: string]: string } = {
            'completed': 'bg-green-100 text-green-800',
            'shipping': 'bg-cyan-100 text-cyan-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
            'refund_requested': 'bg-orange-100 text-orange-800',
            'pending': 'bg-yellow-100 text-yellow-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">{t('productDetail.loginRequired')}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('mypage.title')}</h1>
                    <p className="text-gray-600">{t('nav.greeting', { name: currentUser.name })}</p>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>

                {currentUser.is_seller === 1 ? (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">{t('mypage.sellerMenu') || '판매자 메뉴'}</h2>
                        <button
                            onClick={() => {
                                setRoute('seller-dashboard');
                                window.location.hash = 'seller-dashboard';
                            }}
                            className="w-full p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
                        >
                            <div className="text-2xl mb-2">📦</div>
                            <div className="font-semibold text-gray-900">{t('mypage.goToDashboard')}</div>
                            <div className="text-sm text-gray-600">{t('mypage.manageProducts') || '상품 및 주문 관리'}</div>
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-2">{t('mypage.becomeSeller') || '판매자가 되어보세요!'}</h2>
                        <p className="text-gray-600 mb-4">{t('mypage.sellerDescription') || '상품을 등록하고 판매를 시작할 수 있습니다.'}</p>
                        <button
                            onClick={() => {
                                setRoute('seller-register');
                                window.location.hash = 'seller-register';
                            }}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                        >
                            {t('mypage.registerSeller')}
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">{t('mypage.orderHistory')}</h2>
                    </div>

                    <div className="p-6">
                        {orders.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600">{t('mypage.noOrders')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {currentOrders.map((order) => (
                                        <div key={order.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        {t('mypage.orderDate')}: {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {t('mypage.seller')}: {order.seller.name}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <img 
                                                            src={item.product.image_url.startsWith('http') 
                                                                ? item.product.image_url 
                                                                : `${API_BASE_URL}${item.product.image_url}`
                                                            }
                                                            alt={item.product.name}
                                                            className="w-16 h-16 object-cover rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.product.name}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {item.product.price} × {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-6 flex justify-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {t('mypage.previous')}
                                        </button>
                                        <span className="px-4 py-2">{currentPage} / {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {t('mypage.next')}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPage;