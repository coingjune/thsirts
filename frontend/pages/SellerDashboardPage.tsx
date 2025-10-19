import React, { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
    image_url: string;
    category_main: string;
    category_sub?: string;
    is_active: number;
    images?: Array<{
        id: number;
        image_url: string;
        display_order: number;
    }>;
}

interface Order {
    id: number;
    recipient_name: string;
    address: string;
    phone: string;
    delivery_request: string | null;
    status: string;
    created_at: string;
    order_items: Array<{
        quantity: number;
        product: Product;
    }>;
}

interface SellerDashboardPageProps {
    setRoute: (route: string) => void;
}

interface Categories {
    [key: string]: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const STATUS_OPTIONS = [
    { value: 'cancelled', label: '주문취소' },
    { value: 'refund_requested', label: '환불요청' },
    { value: 'refund_completed', label: '환불완료' },
    { value: 'pending', label: '주문완료-입금확인중' },
    { value: 'paid', label: '제작대기중' },
    { value: 'preparing', label: '제작중' },
    { value: 'ready_to_ship', label: '배송대기중' },
    { value: 'shipping', label: '배송중' },
    { value: 'delivered', label: '배송완료' }
];

const SellerDashboardPage: React.FC<SellerDashboardPageProps> = ({ setRoute }) => {
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<Categories>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [categoryMain, setCategoryMain] = useState('미분류');
    const [categorySub, setCategorySub] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const formRef = React.useRef<HTMLDivElement>(null);

    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        fetchMyProducts();
        fetchMyOrders();
        fetchCategories();
    }, []);

    useEffect(() => {
        // 폼이 열릴 때 스크롤
        if (showAddForm && formRef.current) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [showAddForm]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order =>
                order.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.phone.includes(searchQuery) ||
                order.order_items.some(item =>
                    item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
            setFilteredOrders(filtered);
        }
        setCurrentPage(1);
    }, [searchQuery, orders]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('카테고리 조회 실패:', err);
        }
    };

    const fetchMyProducts = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/products/my/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (err) {
            console.error('상품 조회 실패:', err);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/sellers/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
                setFilteredOrders(data);
            }
        } catch (err) {
            console.error('주문 조회 실패:', err);
        }
    };

    const handleAddOrEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName || !price || !description || !categoryMain) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (!editingProduct && imagePreviews.length === 0) {
            alert('최소 1개의 이미지를 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('access_token');
            const url = editingProduct 
                ? `${API_BASE_URL}/api/products/${editingProduct.id}`
                : `${API_BASE_URL}/api/products`;
            const method = editingProduct ? 'PUT' : 'POST';

            const formData = new FormData();
            formData.append('name', productName);
            formData.append('price', price);
            formData.append('description', description);
            formData.append('category_main', categoryMain);
            if (categorySub) {
                formData.append('category_sub', categorySub);
            }
            
            if (editingProduct) {
                // 수정 모드: 슬롯 순서대로 처리
                const keepUrls: string[] = [];
                const newFileIndices: number[] = [];
                
                imagePreviews.forEach((preview, index) => {
                    if (imageFiles[index]) {
                        // 새 파일이 있는 슬롯
                        newFileIndices.push(index);
                    } else if (preview.startsWith(API_BASE_URL)) {
                        // 기존 이미지 유지
                        keepUrls.push(preview.replace(API_BASE_URL, ''));
                    }
                });
                
                // 슬롯 순서 정보 전송
                const slotInfo = imagePreviews.map((preview, index) => ({
                    index: index,
                    isNew: !!imageFiles[index],
                    url: imageFiles[index] ? null : (preview.startsWith(API_BASE_URL) ? preview.replace(API_BASE_URL, '') : null)
                })).filter(item => item.url !== null || item.isNew);
                
                formData.append('slot_info', JSON.stringify(slotInfo));
                
                // 새 파일들을 순서대로 추가
                newFileIndices.forEach(slotIndex => {
                    const file = imageFiles[slotIndex];
                    if (file) {
                        formData.append('images', file);
                    }
                });
            } else {
                // 생성 모드: 파일만 전송
                imageFiles.forEach((file) => {
                    if (file) {
                        formData.append('images', file);
                    }
                });
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('상품 처리에 실패했습니다.');

            alert(editingProduct ? '상품이 수정되었습니다!' : '상품이 등록되었습니다!');
            setShowAddForm(false);
            setEditingProduct(null);
            resetForm();
            fetchMyProducts();
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const slotIndex = parseInt(e.target.dataset.slotIndex || '0');
        
        if (file) {
            const newFiles = [...imageFiles];
            const newPreviews = [...imagePreviews];
            
            // 해당 슬롯에 파일 할당
            newFiles[slotIndex] = file;
            
            // 미리보기 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews[slotIndex] = reader.result as string;
                setImagePreviews(newPreviews);
            };
            reader.readAsDataURL(file);
            
            setImageFiles(newFiles);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = [...imageFiles];
        const newPreviews = [...imagePreviews];
        
        // 해당 인덱스 제거
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setProductName(product.name);
        setPrice(product.price);
        setDescription(product.description);
        setImageUrl(product.image_url);
        
        // 기존 이미지들을 미리보기로 표시
        if (product.images && product.images.length > 0) {
            const previews = product.images.map(img => `${API_BASE_URL}${img.image_url}`);
            setImagePreviews(previews);
        } else {
            setImagePreviews([`${API_BASE_URL}${product.image_url}`]);
        }
        setImageFiles([]);
        
        setCategoryMain(product.category_main);
        setCategorySub(product.category_sub || '');
        setShowAddForm(true);
    };

    const handleReactivate = (product: Product) => {
        setEditingProduct(product);
        setProductName(product.name);
        setPrice(product.price);
        setDescription(product.description);
        setImageUrl(product.image_url);
        
        if (product.images && product.images.length > 0) {
            const previews = product.images.map(img => `${API_BASE_URL}${img.image_url}`);
            setImagePreviews(previews);
        } else {
            setImagePreviews([`${API_BASE_URL}${product.image_url}`]);
        }
        setImageFiles([]);
        
        setCategoryMain(product.category_main);
        setCategorySub(product.category_sub || '');
        setShowAddForm(true);
    };

    const handleDelete = async (productId: number) => {
        if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;

        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('삭제에 실패했습니다.');
            alert('상품이 삭제되었습니다!');
            fetchMyProducts();
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/sellers/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('상태 변경에 실패했습니다.');
            alert('주문 상태가 변경되었습니다!');
            fetchMyOrders();
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
    };

    const resetForm = () => {
        setProductName('');
        setPrice('');
        setDescription('');
        setImageUrl('');
        setImageFiles([]);
        setImagePreviews([]);
        setCategoryMain('미분류');
        setCategorySub('');
    };

    const cancelEdit = () => {
        setShowAddForm(false);
        setEditingProduct(null);
        resetForm();
    };

    const getStatusLabel = (status: string) => {
        return STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
    };

    const groupOrdersByDate = (orders: Order[]) => {
        const grouped: { [key: string]: Order[] } = {};
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('ko-KR');
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(order);
        });
        return grouped;
    };

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentOrders = filteredOrders.slice(startIndex, endIndex);
    const groupedOrders = groupOrdersByDate(currentOrders);

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">판매자 대시보드</h1>
                </div>

                {/* 탭 메뉴 */}
                <div className="bg-white rounded-t-lg shadow mb-0">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex-1 py-4 px-6 font-medium ${
                                activeTab === 'products'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            내 상품 ({products.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 py-4 px-6 font-medium ${
                                activeTab === 'orders'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            주문 관리 ({orders.length})
                        </button>
                    </div>
                </div>

                {/* 상품 관리 탭 */}
                {activeTab === 'products' && (
                    <div className="bg-white rounded-b-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">상품 관리</h2>
                            <button
                                onClick={() => {
                                    if (showAddForm) cancelEdit();
                                    else setShowAddForm(true);
                                }}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                            >
                                {showAddForm ? '취소' : '+ 상품 등록'}
                            </button>
                        </div>

                        {/* 상품 등록/수정 폼 */}
                        {showAddForm && (
                            <div ref={formRef} className="bg-gray-50 rounded-lg p-6 mb-8 relative z-10">
                                <h3 className="text-lg font-semibold mb-4">
                                    {editingProduct ? '상품 수정' : '새 상품 등록'}
                                </h3>
                                <form onSubmit={handleAddOrEditProduct} className="space-y-4 relative">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            상품명 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="예: 클래식 코튼 티셔츠"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                대분류 <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={categoryMain}
                                                onChange={(e) => {
                                                    setCategoryMain(e.target.value);
                                                    setCategorySub('');
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none cursor-pointer"
                                                style={{ zIndex: 50 }}
                                                required
                                            >
                                                {Object.keys(categories).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                소분류 (선택)
                                            </label>
                                            <select
                                                value={categorySub}
                                                onChange={(e) => setCategorySub(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                style={{ zIndex: 50 }}
                                                disabled={!categories[categoryMain] || categories[categoryMain].length === 0}
                                            >
                                                <option value="">선택 안 함</option>
                                                {categories[categoryMain]?.map(subCat => (
                                                    <option key={subCat} value={subCat}>{subCat}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            가격 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="예: 25,000원"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            상품 설명 <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            rows={4}
                                            placeholder="상품 설명을 입력하세요"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            상품 이미지 (최대 5개) <span className="text-red-500">*</span>
                                        </label>
                                        
                                        {/* 이미지 슬롯 그리드 */}
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600 mb-2">
                                                {editingProduct && imageFiles.length === 0 ? '현재 이미지 (클릭하여 교체 가능):' : '이미지 슬롯 (첫 번째가 메인 이미지):'}
                                            </p>
                                            <div className="grid grid-cols-5 gap-3">
                                                {/* 기존 이미지 슬롯들 */}
                                                {Array.from({ length: Math.min(imagePreviews.length, 5) }).map((_, index) => (
                                                    <div key={index} className="relative group">
                                                        <div className={`border-2 rounded-md overflow-hidden ${index === 0 ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                            <label className="cursor-pointer block">
                                                                <img 
                                                                    src={imagePreviews[index]} 
                                                                    alt={`이미지 ${index + 1}`}
                                                                    className="w-full h-24 object-cover"
                                                                />
                                                                <input
                                                                    type="file"
                                                                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                                                    onChange={handleImageChange}
                                                                    data-slot-index={index}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        </div>
                                                        {index === 0 && (
                                                            <div className="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                                                                메인
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                
                                                {/* 새 이미지 추가 슬롯 (5개 미만일 때만) */}
                                                {imagePreviews.length < 5 && (
                                                    <div className="relative">
                                                        <label className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-md hover:border-indigo-400 transition-colors">
                                                            <div className="w-full h-24 flex items-center justify-center bg-gray-50">
                                                                <div className="text-center">
                                                                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                    <p className="mt-1 text-xs text-gray-500">추가</p>
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                                                onChange={handleImageChange}
                                                                data-slot-index={imagePreviews.length}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <p className="mt-1 text-sm text-gray-500">
                                            PNG, JPG, GIF, WEBP 형식 지원 • 각 슬롯을 클릭하여 이미지 추가/교체 • 첫 번째 이미지가 메인으로 표시됩니다
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium disabled:bg-indigo-400"
                                    >
                                        {isSubmitting ? '처리 중...' : editingProduct ? '수정 완료' : '상품 등록'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* 상품 목록 */}
                        {products.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>등록된 상품이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div 
                                        key={product.id} 
                                        className={`border rounded-lg overflow-hidden ${
                                            product.is_active === 0 ? 'opacity-50 bg-gray-100' : ''
                                        }`}
                                    >
                                        <div className="relative">
                                            <img 
                                                src={product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`}
                                                alt={product.name}
                                                className="w-full h-48 object-cover"
                                            />
                                            {product.is_active === 0 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">삭제됨</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                    {product.category_main}
                                                </span>
                                                {product.category_sub && (
                                                    <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                                                        {product.category_sub}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                                            <p className="text-indigo-600 font-medium mb-2">{product.price}</p>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>
                                            
                                            {product.is_active === 1 ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-sm"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(product)}
                                                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm"
                                                >
                                                    재등록
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 주문 관리 탭 */}
                {activeTab === 'orders' && (
                    <div className="bg-white rounded-b-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">주문 관리 ({filteredOrders.length})</h2>
                        </div>

                        {/* 검색창 */}
                        <div className="relative mb-6">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="상품명, 받는사람, 주소, 전화번호로 검색..."
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>{searchQuery ? '검색 결과가 없습니다.' : '주문 내역이 없습니다.'}</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-8">
                                    {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                                        <div key={date}>
                                            <div className="flex items-center mb-4">
                                                <div className="flex-1 border-t border-gray-300"></div>
                                                <span className="px-4 text-sm font-medium text-gray-600">{date}</span>
                                                <div className="flex-1 border-t border-gray-300"></div>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                {dateOrders.map((order) => (
                                                    <div key={order.id} className="border rounded-lg p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="text-lg font-semibold">주문 #{order.id}</h3>
                                                                <p className="text-sm text-gray-500">
                                                                    {new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    주문 상태
                                                                </label>
                                                                <select
                                                                    value={order.status}
                                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                                >
                                                                    {STATUS_OPTIONS.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>
                                                                            {opt.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 mb-4">
                                                            {order.order_items.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-4">
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
                                                                            {item.product.price} × {item.quantity}개
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="border-t pt-4 text-sm text-gray-600">
                                                            <p><strong>받는 사람:</strong> {order.recipient_name}</p>
                                                            <p><strong>배송지:</strong> {order.address}</p>
                                                            <p><strong>연락처:</strong> {order.phone}</p>
                                                            {order.delivery_request && (
                                                                <p><strong>배송 요청사항:</strong> {order.delivery_request}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 페이지네이션 */}
                                {totalPages > 1 && (
                                    <div className="mt-8 flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            이전
                                        </button>
                                        
                                        <div className="flex gap-2">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-4 py-2 border rounded-md ${
                                                            currentPage === pageNum
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            다음
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboardPage;