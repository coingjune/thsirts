import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: string;
        image_url: string;
        seller_id: number;
        seller: {
            id: number;
            name: string;
            kakaopay_link: string;
            kakaopay_qr_url: string | null;
        };
    };
}

interface GroupedItems {
    [sellerId: number]: {
        seller: {
            id: number;
            name: string;
            kakaopay_link: string;
            kakaopay_qr_url: string | null;
        };
        items: OrderItem[];
    };
}

interface OrderPageProps {
    setRoute: (route: string) => void;
    onCartUpdate?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const OrderPage: React.FC<OrderPageProps> = ({ setRoute, onCartUpdate }) => {
    const { t } = useTranslation();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [recipientName, setRecipientName] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [deliveryRequest, setDeliveryRequest] = useState('');
    const [completedSellers, setCompletedSellers] = useState<Set<number>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const items = sessionStorage.getItem('orderItems');
        if (items) {
            setOrderItems(JSON.parse(items));
        } else {
            alert(t('order.noItems') || '주문할 상품이 없습니다.');
            setRoute('cart');
        }
    }, []);

    const groupedItems: GroupedItems = orderItems.reduce((acc, item) => {
        const sellerId = item.product.seller_id;
        if (!acc[sellerId]) {
            acc[sellerId] = {
                seller: item.product.seller,
                items: []
            };
        }
        acc[sellerId].items.push(item);
        return acc;
    }, {} as GroupedItems);

    const handleOrderComplete = async (sellerId: number) => {
        if (!recipientName || !postalCode || !address || !phone) {
            alert(t('order.fillRequired') || '배송 정보를 모두 입력해주세요.');
            return;
        }

        if (!window.confirm(t('order.confirmComplete'))) {
            return;
        }

        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('access_token');
            const sellerItems = groupedItems[sellerId].items;

            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    seller_id: sellerId,
                    recipient_name: recipientName,
                    postal_code: postalCode,
                    address: address,
                    phone: phone,
                    delivery_request: deliveryRequest,
                    items: sellerItems.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(t('common.error'));
            }

            for (const item of sellerItems) {
                await fetch(`${API_BASE_URL}/api/cart/${item.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
            
            if (onCartUpdate) {
                onCartUpdate();
            }

            setCompletedSellers(prev => new Set(prev).add(sellerId));
            alert(`${groupedItems[sellerId].seller.name} ${t('order.orderCompleted') || '주문이 완료되었습니다!'}`);

        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteAllOrders = () => {
        const allCompleted = Object.keys(groupedItems).length === completedSellers.size;
        if (allCompleted) {
            alert(t('order.allCompleted'));
            setRoute('home');
            window.location.hash = 'home';
        } else {
            alert(t('order.completeAllFirst') || '모든 판매자에 대한 주문을 완료해주세요.');
        }
    };

    if (orderItems.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('order.title')}</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">{t('order.deliveryInfo') || '배송 정보'}</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('order.recipientName') || '받는 사람'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={t('order.recipientPlaceholder') || '받는 분 성함'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('order.postalCode') || '우편번호'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="12345"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('order.address') || '주소'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={t('order.addressPlaceholder') || '상세 주소를 입력해주세요'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('order.phone') || '연락처'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="010-1234-5678"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('order.deliveryRequest') || '배송 요청사항'}
                            </label>
                            <textarea
                                value={deliveryRequest}
                                onChange={(e) => setDeliveryRequest(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                placeholder={t('order.requestPlaceholder') || '배송 시 요청사항을 입력해주세요 (선택)'}
                            />
                        </div>
                    </div>
                </div>

                {Object.entries(groupedItems).map(([sellerId, { seller, items }]) => {
                    const isCompleted = completedSellers.has(Number(sellerId));
                    
                    return (
                        <div key={sellerId} className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">
                                    📦 {t('order.seller', { name: seller.name })}
                                </h2>
                                {isCompleted && (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {t('order.completed')}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                                        <img 
                                            src={item.product.image_url.startsWith('http') 
                                                ? item.product.image_url 
                                                : `${API_BASE_URL}${item.product.image_url}`
                                            }
                                            alt={item.product.name}
                                            className="w-20 h-20 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {t('order.quantity')}: {item.quantity} | {t('order.price')}: {item.product.price}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold mb-3">{t('order.paymentMethod')}</h3>
                                <p className="text-sm text-gray-600 mb-3">{t('order.kakaopay')}</p>
                                <p className="text-sm text-gray-700 mb-2">{t('order.instructions')}</p>
                                {seller.kakaopay_qr_url && (
                                    <img 
                                        src={seller.kakaopay_qr_url} 
                                        alt="KakaoPay QR"
                                        className="w-48 h-48 mx-auto my-4 border rounded"
                                    />
                                )}
                                <p className="text-sm text-gray-600 mb-2">{t('order.orLink')}</p>
                                <a 
                                    href={seller.kakaopay_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 underline block mb-4"
                                >
                                    {t('order.openKakaopay')}
                                </a>

                                <div className="mt-4">
                                    <button
                                        onClick={() => handleOrderComplete(Number(sellerId))}
                                        disabled={isCompleted || isSubmitting}
                                        className={`w-full py-3 rounded-md font-medium ${
                                            isCompleted 
                                                ? 'bg-green-600 text-white cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                    >
                                        {isCompleted ? t('order.completed') : isSubmitting ? t('order.processing') : t('order.complete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setRoute('cart');
                            window.location.hash = 'cart';
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 font-medium"
                    >
                        {t('order.backToCart')}
                    </button>
                    <button
                        onClick={handleCompleteAllOrders}
                        className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-medium"
                    >
                        {t('order.completeAll', { completed: completedSellers.size, total: Object.keys(groupedItems).length })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;