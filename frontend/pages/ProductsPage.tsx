import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
    image_url: string;
    seller_id: number;
    category_main: string;
    category_sub?: string;
    seller?: {
        id: number;
        name: string;
    };
}

interface ProductsPageProps {
    setRoute: (route: string) => void;
}

interface Categories {
    [key: string]: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE = 9;

const ProductsPage: React.FC<ProductsPageProps> = ({ setRoute }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Categories>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState<string>('전체');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('전체');
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        
        const savedState = sessionStorage.getItem('productsPageState');
        if (savedState) {
            const { category, subCategory, search, page } = JSON.parse(savedState);
            setSelectedMainCategory(category || '전체');
            setSelectedSubCategory(subCategory || '전체');
            setSearchQuery(search || '');
            setCurrentPage(page || 1);
            sessionStorage.removeItem('productsPageState');
        }
    }, []);

    useEffect(() => {
        let filtered = products;

        if (selectedMainCategory !== '전체') {
            filtered = filtered.filter(p => p.category_main === selectedMainCategory);
            
            if (selectedSubCategory !== '전체') {
                filtered = filtered.filter(p => p.category_sub === selectedSubCategory);
            }
        }

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(product => 
                product.seller?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [searchQuery, selectedMainCategory, selectedSubCategory, products]);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            if (!response.ok) {
                throw new Error(t('products.errorLoadFailed', '상품을 불러오는데 실패했습니다.'));
            }
            const data = await response.json();
            setProducts(data);
            setFilteredProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.errorUnknown', '오류가 발생했습니다.'));
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleMainCategoryChange = (category: string) => {
        setSelectedMainCategory(category);
        setSelectedSubCategory('전체');
    };

    const saveStateAndNavigate = (productId: number) => {
        sessionStorage.setItem('productsPageState', JSON.stringify({
            category: selectedMainCategory,
            subCategory: selectedSubCategory,
            search: searchQuery,
            page: currentPage
        }));
        setRoute(`product/${productId}`);
    };

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('products.loading', '상품을 불러오는 중...')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 text-lg">{error}</p>
                    <button 
                        onClick={fetchProducts}
                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                    >
                        {t('common.retry', '다시 시도')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto py-3 space-x-4 scrollbar-hide">
                        <button
                            onClick={() => handleMainCategoryChange('전체')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                                selectedMainCategory === '전체'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            전체
                        </button>
                        {Object.keys(categories).map((category) => (
                            <button
                                key={category}
                                onClick={() => handleMainCategoryChange(category)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                                    selectedMainCategory === category
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {selectedMainCategory !== '전체' && categories[selectedMainCategory]?.length > 0 && (
                        <div className="flex overflow-x-auto py-3 space-x-2 border-t scrollbar-hide">
                            <button
                                onClick={() => setSelectedSubCategory('전체')}
                                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                                    selectedSubCategory === '전체'
                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                전체
                            </button>
                            {categories[selectedMainCategory].map((subCategory) => (
                                <button
                                    key={subCategory}
                                    onClick={() => setSelectedSubCategory(subCategory)}
                                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                                        selectedSubCategory === subCategory
                                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {subCategory}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-8">
                    {t('products.title', '우리의 컬렉션')}
                </h2>
                
                <div className="mb-8 max-w-md mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('products.searchPlaceholder', '상품명 또는 판매자명으로 검색...')}
                            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        {selectedMainCategory !== '전체' && (
                            <span className="mr-2">
                                📁 {selectedMainCategory}
                                {selectedSubCategory !== '전체' && ` > ${selectedSubCategory}`}
                            </span>
                        )}
                        <span>
                            {t('products.searchResult', { count: filteredProducts.length, defaultValue: '검색 결과: {{count}}개' })}
                        </span>
                    </div>
                </div>

                {currentProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">
                            {t('products.emptyResult', '검색 결과가 없습니다.')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 xl:gap-x-8">
                            {currentProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => saveStateAndNavigate(product.id)}
                                    className="group cursor-pointer"
                                >
                                    <div className="w-full bg-gray-200 rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
                                        <img 
                                            src={product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`}
                                            alt={product.name} 
                                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-300" 
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                            {product.category_main}
                                        </span>
                                        {product.category_sub && (
                                            <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                                                {product.category_sub}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mt-2 text-sm text-gray-700">{product.name}</h3>
                                    <p className="mt-1 text-lg font-medium text-gray-900">{product.price}</p>
                                    {product.seller && (
                                        <p className="mt-1 text-xs text-gray-500">판매자: {product.seller.name}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('common.prev', '이전')}
                                </button>
                                
                                <div className="flex gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 border rounded-md ${
                                                currentPage === page
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('common.next', '다음')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;