import React, { useState, useEffect } from 'react';

interface Seller {
    id: number;
    user_id: number;
    name: string;
    kakaopay_link: string;
    kakaopay_qr_url: string | null;
}

interface User {
    name: string;
    email: string;
    is_seller: number;
}

interface Product {
    id: number;
    name: string;
    price: string;
    image_url: string;
}

interface Order {
    id: number;
    seller_id: number;
    recipient_name: string;
    address: string;
    phone: string;
    delivery_request: string | null;
    status: string;
    created_at: string;
    seller: {
        name: string;
    };
    order_items: Array<{
        quantity: number;
        product: Product;
    }>;
}

interface MyPageProps {
    setRoute: (route: string) => void;
    currentUser: User | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const MyPage: React.FC<MyPageProps> = ({ setRoute, currentUser }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (currentUser) {
            fetchOrders();
            if (currentUser.is_seller === 1) {
                fetchSellerInfo();
            }
        }
    }, [currentUser]);

    useEffect(() => {
        // 검색 필터링
        if (searchQuery.trim() === '') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order =>
                order.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.order_items.some(item => 
                    item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
            setFilteredOrders(filtered);
        }
        setCurrentPage(1);
    }, [searchQuery, orders]);

    const fetchSellerInfo = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/sellers/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSeller(data);
            }
        } catch (err) {
            console.error('판매자 정보 조회 실패:', err);
        }
    };

    const fetchOrders = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (err) {
            console.error('주문 내역 조회 실패:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyProducts = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/products/my/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // products state 제거
            }
        } catch (err) {
            console.error('상품 조회 실패:', err);
        }
    };

    // 날짜별 그룹화
    const groupOrdersByDate = (orders: Order[]) => {
        const grouped: { [key: string]: Order[] } = {};
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('ko-KR');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(order);
        });
        return grouped;
    };

    // 페이지네이션
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentOrders = filteredOrders.slice(startIndex, endIndex);
    const groupedOrders = groupOrdersByDate(currentOrders);

    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'cancelled': '주문취소',
            'refund_requested': '환불요청',
            'refund_completed': '환불완료',
            'pending': '주문완료-입금확인중',
            'paid': '제작대기중',
            'preparing': '제작중',
            'ready_to_ship': '배송대기중',
            'shipping': '배송중',
            'delivered': '배송완료'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colorMap: { [key: string]: string } = {
            'cancelled': 'bg-red-100 text-red-800',
            'refund_requested': 'bg-orange-100 text-orange-800',
            'refund_completed': 'bg-gray-100 text-gray-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'paid': 'bg-blue-100 text-blue-800',
            'preparing': 'bg-indigo-100 text-indigo-800',
            'ready_to_ship': 'bg-purple-100 text-purple-800',
            'shipping': 'bg-cyan-100 text-cyan-800',
            'delivered': 'bg-green-100 text-green-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">로그인이 필요합니다.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
                    <p className="text-gray-600">{currentUser.name}님 환영합니다!</p>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>

                {/* 판매자 정보 또는 등록 버튼 */}
                {currentUser.is_seller === 1 ? (
                    <>
                        {/* 판매자 정보 */}
                        {seller && (
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-semibold">판매자 정보</h2>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                        수정하기
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">판매자명</p>
                                        <p className="font-medium text-gray-900">{seller.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">카카오페이 링크</p>
                                        <a 
                                            href={seller.kakaopay_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline text-sm break-all"
                                        >
                                            {seller.kakaopay_link}
                                        </a>
                                    </div>
                                    {seller.kakaopay_qr_url && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-gray-600 mb-2">카카오페이 QR 코드</p>
                                            <img 
                                                src={seller.kakaopay_qr_url.startsWith('http')
                                                    ? seller.kakaopay_qr_url
                                                    : `${API_BASE_URL}${seller.kakaopay_qr_url}`
                                                }
                                                alt="카카오페이 QR"
                                                className="w-48 h-48 object-contain border rounded-md"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 판매자 메뉴 */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">판매자 메뉴</h2>
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <button
                                    onClick={() => {
                                        setRoute('seller-dashboard');
                                        window.location.hash = 'seller-dashboard';
                                    }}
                                    className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
                                >
                                    <div className="text-2xl mb-2">📦</div>
                                    <div className="font-semibold text-gray-900">판매자 대시보드</div>
                                    <div className="text-sm text-gray-600">상품 및 주문 관리</div>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-2">판매자가 되어보세요!</h2>
                        <p className="text-gray-600 mb-4">상품을 등록하고 판매를 시작할 수 있습니다.</p>
                        <button
                            onClick={() => {
                                setRoute('seller-register');
                                window.location.hash = 'seller-register';
                            }}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                        >
                            판매자 등록하기
                        </button>
                    </div>
                )}

                {/* 주문 내역 (외부 스토어로 전환되면서 현재는 사용하지 않음)
                <div className="bg-white rounded-lg shadow">
                    ...
                </div>
                */}
            </div>

            {/* 판매자 정보 수정 모달 */}
            {showEditModal && seller && (
                <SellerEditModal
                    seller={seller}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        fetchSellerInfo();
                    }}
                />
            )}
        </div>
    );
};

// 판매자 정보 수정 모달 컴포넌트
const SellerEditModal: React.FC<{
    seller: Seller;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ seller, onClose, onSuccess }) => {
    const [sellerName, setSellerName] = useState(seller.name);
    const [kakaopayLink, setKakaopayLink] = useState(seller.kakaopay_link);
    const [qrImage, setQrImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setQrImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = sessionStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('name', sellerName);
            formData.append('kakaopay_link', kakaopayLink);
            if (qrImage) {
                formData.append('qr_image', qrImage);
            }

            const response = await fetch(`${API_BASE_URL}/api/sellers/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('수정에 실패했습니다.');
            }

            alert('판매자 정보가 수정되었습니다!');
            onSuccess();
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">판매자 정보 수정</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                판매자명 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={sellerName}
                                onChange={(e) => setSellerName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카카오페이 송금 링크 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                value={kakaopayLink}
                                onChange={(e) => setKakaopayLink(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카카오페이 QR 코드 이미지 변경 (선택)
                            </label>
                            {seller.kakaopay_qr_url && !preview && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">현재 QR 코드:</p>
                                    <img 
                                        src={seller.kakaopay_qr_url.startsWith('http')
                                            ? seller.kakaopay_qr_url
                                            : `${API_BASE_URL}${seller.kakaopay_qr_url}`
                                        }
                                        alt="현재 QR"
                                        className="w-32 h-32 object-contain border rounded-md"
                                    />
                                </div>
                            )}
                            <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 inline-block">
                                <span className="text-sm text-gray-700">새 파일 선택</span>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            {qrImage && <span className="ml-2 text-sm text-gray-600">{qrImage.name}</span>}
                            {preview && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">새 QR 코드:</p>
                                    <img src={preview} alt="QR 미리보기" className="w-32 h-32 object-contain border rounded-md" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 font-medium"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium disabled:bg-indigo-400"
                            >
                                {isSubmitting ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyPage;