import React, { useState, useEffect } from 'react';

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
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const OrderPage: React.FC<OrderPageProps> = ({ setRoute, onCartUpdate}) => {
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
            alert('주문할 상품이 없습니다.');
            setRoute('cart');
        }
    }, []);

    // 판매자별로 상품 그룹화
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
            alert('배송 정보를 모두 입력해주세요.');
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
                throw new Error('주문 생성에 실패했습니다.');
            }

            // 주문 완료 후 장바구니에서 해당 상품 삭제
            for (const item of sellerItems) {
                await fetch(`${API_BASE_URL}/api/cart/${item.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
            
            // ✅ 여기서 네비바 장바구니 숫자 즉시 업데이트
            if (onCartUpdate) {
                onCartUpdate();
            }



            setCompletedSellers(prev => new Set(prev).add(sellerId));
            alert(`${groupedItems[sellerId].seller.name}에 대한 주문이 완료되었습니다!`);

        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteAllOrders = () => {
        const allCompleted = Object.keys(groupedItems).length === completedSellers.size;
        if (allCompleted) {
            alert('모든 주문이 완료되었습니다!');
            // 장바구니 비우기 로직은 추후 추가
            setRoute('home');
            window.location.hash = 'home';
        } else {
            alert('모든 판매자에 대한 주문을 완료해주세요.');
        }
    };

    if (orderItems.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">주문 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">주문/결제</h1>

                {/* 배송 정보 입력 (공통) */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">배송 정보</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                받는 사람 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="받는 분 성함"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                우편번호 <span className="text-red-500">*</span>
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
                                상세 주소 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="상세 주소를 입력해주세요"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                휴대폰 번호 <span className="text-red-500">*</span>
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
                                배송 요청사항
                            </label>
                            <textarea
                                value={deliveryRequest}
                                onChange={(e) => setDeliveryRequest(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                placeholder="배송 시 요청사항을 입력해주세요 (선택)"
                            />
                        </div>
                    </div>
                </div>

                {/* 판매자별 주문 섹션 */}
                {Object.entries(groupedItems).map(([sellerId, { seller, items }]) => {
                    const isCompleted = completedSellers.has(Number(sellerId));
                    
                    return (
                        <div key={sellerId} className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">
                                    📦 {seller.name}
                                </h2>
                                {isCompleted && (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                        ✓ 주문 완료
                                    </span>
                                )}
                            </div>

                            {/* 상품 목록 */}
                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                                        <img 
                                            src={item.product.image_url.startsWith('http') ? item.product.image_url : `${API_BASE_URL}${item.product.image_url}`} 
                                            alt={item.product.name}
                                            className="w-20 h-20 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                            <p className="text-gray-600">{item.product.price}</p>
                                            <p className="text-sm text-gray-500">수량: {item.quantity}개</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 결제 정보 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-center text-sm font-medium text-gray-700 mb-4">
                                    {seller.name}에게 카카오페이로 결제해주세요
                                </p>
                                
                                <div className="flex flex-col items-center gap-4">
                                    {seller.kakaopay_qr_url ? (
                                        <img 
                                            src={`${API_BASE_URL}${seller.kakaopay_qr_url}`}
                                            alt="카카오페이 QR"
                                            className="w-48 h-48 object-contain border rounded-md"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <svg className="w-16 h-16 mx-auto mb-2 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                                                </svg>
                                                <p className="text-xs text-gray-600">아래 버튼으로<br/>결제하세요</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <a
                                        href={seller.kakaopay_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-md hover:bg-yellow-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                                        </svg>
                                        카카오페이로 송금하기
                                    </a>
                                    
                                    <button
                                        onClick={() => handleOrderComplete(Number(sellerId))}
                                        disabled={isCompleted || isSubmitting}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isCompleted ? '✓ 주문 완료됨' : isSubmitting ? '처리 중...' : '송금 완료 후 주문 완료'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 전체 완료 버튼 */}
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setRoute('cart');
                            window.location.hash = 'cart';
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 font-medium"
                    >
                        장바구니로 돌아가기
                    </button>
                    <button
                        onClick={handleCompleteAllOrders}
                        className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-medium"
                    >
                        모든 주문 완료 ({completedSellers.size}/{Object.keys(groupedItems).length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;