import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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

const SellerDashboardPage: React.FC<SellerDashboardPageProps> = ({ setRoute }) => {
    const { t } = useTranslation();
    
    const STATUS_OPTIONS = [
        { value: 'cancelled', label: t('seller.status.cancelled') },
        { value: 'refund_requested', label: t('seller.status.refundRequested') },
        { value: 'refund_completed', label: t('seller.status.refundCompleted') },
        { value: 'pending', label: t('seller.status.pending') },
        { value: 'paid', label: t('seller.status.paid') },
        { value: 'preparing', label: t('seller.status.preparing') },
        { value: 'ready_to_ship', label: t('seller.status.readyToShip') },
        { value: 'shipping', label: t('seller.status.shipping') },
        { value: 'delivered', label: t('seller.status.delivered') }
    ];
    
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
            const response = await fetch(`${API_BASE_URL}/api/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchMyProducts = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/sellers/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
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
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setProductName(product.name);
        setPrice(product.price);
        setDescription(product.description);
        setCategoryMain(product.category_main);
        setCategorySub(product.category_sub || '');
        
        if (product.images && product.images.length > 0) {
            const urls = product.images
                .sort((a, b) => a.display_order - b.display_order)
                .map(img => img.image_url);
            setImagePreviews(urls);
            setImageFiles([]);
        }
        
        setShowAddForm(true);
    };

    const handleReactivate = async (product: Product) => {
        if (!confirm(t('seller.product.confirmReactivate'))) return;

        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}/reactivate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(t('common.error'));
            alert(t('seller.product.reactivated'));
            fetchMyProducts();
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (imageFiles.length === 0 && imagePreviews.length === 0) {
            alert(t('seller.product.imageRequired'));
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const token = sessionStorage.getItem('access_token');
            const formData = new FormData();
            
            formData.append('name', productName);
            formData.append('price', price);
            formData.append('description', description);
            formData.append('category_main', categoryMain);
            if (categorySub) formData.append('category_sub', categorySub);
            
            if (imageFiles.length > 0) {
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });
            }

            const url = editingProduct 
                ? `${API_BASE_URL}/api/products/${editingProduct.id}`
                : `${API_BASE_URL}/api/products`;
                
            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error(t('common.error'));

            alert(editingProduct ? t('seller.product.updated') : t('seller.product.created'));
            setShowAddForm(false);
            setEditingProduct(null);
            resetForm();
            fetchMyProducts();
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
        const newFiles = Array.from(files);
        const currentCount = imageFiles.length + imagePreviews.length;
        const availableSlots = 5 - currentCount;
        
        if (newFiles.length > availableSlots) {
            alert(t('seller.product.imageLimit', { count: 5 }));
            return;
        }
        
        setImageFiles(prev => [...prev, ...newFiles]);
        
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file as Blob);
        });
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDelete = async (productId: number) => {
        if (!confirm(t('seller.product.confirmDelete'))) return;

        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(t('common.error'));
            alert(t('seller.product.deleted'));
            fetchMyProducts();
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
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

            if (!response.ok) throw new Error(t('common.error'));
            alert(t('seller.order.statusChanged'));
            fetchMyOrders();
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
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
                    <h1 className="text-3xl font-bold text-gray-900">{t('seller.dashboard.title')}</h1>
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
                            {t('seller.tab.products')} ({products.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 py-4 px-6 font-medium ${
                                activeTab === 'orders'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('seller.tab.orders')} ({orders.length})
                        </button>
                    </div>
                </div>

                {/* 상품 관리 탭 */}
                {activeTab === 'products' && (
                    <div className="bg-white rounded-b-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">{t('seller.product.management')}</h2>
                            <button
                                onClick={() => {
                                    if (showAddForm) cancelEdit();
                                    else setShowAddForm(true);
                                }}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                            >
                                {showAddForm ? t('common.cancel') : t('seller.product.addButton')}
                            </button>
                        </div>

                        {/* 상품 등록/수정 폼 */}
                        {showAddForm && (
                            <div ref={formRef} className="bg-gray-50 rounded-lg p-6 mb-8 relative z-10">
                                <h3 className="text-lg font-semibold mb-4">
                                    {editingProduct ? t('seller.product.editTitle') : t('seller.product.addTitle')}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('seller.product.name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder={t('seller.product.namePlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('seller.product.price')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder={t('seller.product.pricePlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('seller.product.description')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            rows={4}
                                            placeholder={t('seller.product.descriptionPlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('seller.product.images')} <span className="text-red-500">*</span>
                                        </label>
                                        
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600 mb-2">
                                                {editingProduct && imageFiles.length === 0 
                                                    ? t('seller.product.currentImages')
                                                    : t('seller.product.imageSlots')}
                                            </p>
                                            <div className="grid grid-cols-5 gap-3">
                                                {Array.from({ length: Math.min(imagePreviews.length, 5) }).map((_, index) => (
                                                    <div key={index} className="relative group">
                                                        <div className={`border-2 rounded-md overflow-hidden ${index === 0 ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                            <img
                                                                src={imagePreviews[index]}
                                                                alt={`Preview ${index + 1}`}
                                                                className="w-full h-24 object-cover"
                                                            />
                                                            {index === 0 && (
                                                                <div className="absolute top-0 left-0 bg-indigo-600 text-white text-xs px-2 py-1">
                                                                    {t('seller.product.mainImage')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                
                                                {imagePreviews.length < 5 && (
                                                    <div className="relative">
                                                        <label className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-md hover:border-indigo-400 transition-colors">
                                                            <div className="w-full h-24 flex items-center justify-center bg-gray-50">
                                                                <div className="text-center">
                                                                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                    <span className="text-xs text-gray-500">{t('seller.product.addImage')}</span>
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={handleImageChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('seller.product.mainCategory')} <span className="text-red-500">*</span>
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
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('seller.product.subCategory')}
                                        </label>
                                        <select
                                            value={categorySub}
                                            onChange={(e) => setCategorySub(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none cursor-pointer"
                                            style={{ zIndex: 50 }}
                                            disabled={!categories[categoryMain] || categories[categoryMain].length === 0}
                                        >
                                            <option value="">{t('seller.product.selectSubCategory')}</option>
                                            {categories[categoryMain]?.map(subCat => (
                                                <option key={subCat} value={subCat}>{subCat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {isSubmitting ? t('common.saving') : (editingProduct ? t('common.save') : t('seller.product.register'))}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* 상품 목록 */}
                        {products.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">{t('seller.product.noProducts')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <div key={product.id} className={`border rounded-lg overflow-hidden ${product.is_active ? 'bg-white' : 'bg-gray-100'}`}>
                                        <img 
                                            src={product.images?.[0]?.image_url || product.image_url} 
                                            alt={product.name}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                                <span className={`px-2 py-1 text-xs rounded ${
                                                    product.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {product.is_active ? t('seller.product.active') : t('seller.product.inactive')}
                                                </span>
                                            </div>
                                            <p className="text-indigo-600 font-bold mb-2">{product.price}</p>
                                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                                            <p className="text-sm text-gray-500">
                                                {t('seller.product.category')}: {product.category_main}
                                                {product.category_sub && ` > ${product.category_sub}`}
                                            </p>
                                            {product.is_active ? (
                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                                                    >
                                                        {t('common.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-sm"
                                                    >
                                                        {t('common.delete')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(product)}
                                                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm mt-4"
                                                >
                                                    {t('seller.product.reactivate')}
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
                            <h2 className="text-xl font-semibold">{t('seller.order.management')}</h2>
                            <div className="relative w-1/3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('seller.order.searchPlaceholder')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">
                                    {searchQuery ? t('seller.order.noSearchResults') : t('seller.order.noOrders')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 text-sm text-gray-600">
                                    {t('seller.order.total')}: {filteredOrders.length}{t('seller.order.totalUnit')}
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                                        <div key={date}>
                                            <h3 className="text-lg font-semibold mb-3 text-gray-700">{date}</h3>
                                            <div className="space-y-4">
                                                {dateOrders.map(order => (
                                                    <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <p className="text-sm text-gray-500">
                                                                    {t('seller.order.number')}: #{order.id}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {new Date(order.created_at).toLocaleString('ko-KR')}
                                                                </p>
                                                            </div>
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                                className="px-3 py-1 border rounded-md text-sm"
                                                            >
                                                                {STATUS_OPTIONS.map(option => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>{t('seller.order.recipient')}:</strong> {order.recipient_name}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>{t('seller.order.address')}:</strong> {order.address}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>{t('seller.order.phone')}:</strong> {order.phone}
                                                                </p>
                                                                {order.delivery_request && (
                                                                    <p className="text-sm text-gray-600">
                                                                        <strong>{t('seller.order.deliveryRequest')}:</strong> {order.delivery_request}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold mb-2">{t('seller.order.items')}:</p>
                                                                {order.order_items.map((item, idx) => (
                                                                    <div key={idx} className="text-sm text-gray-600 mb-1">
                                                                        • {item.product.name} x {item.quantity}
                                                                    </div>
                                                                ))}
                                                            </div>
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
                                            {t('common.previous')}
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
                                            {t('common.next')}
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