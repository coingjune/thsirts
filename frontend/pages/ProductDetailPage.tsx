import React, { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
    image_url: string;
    seller_id: number;
    category_main: string;
    category_sub?: string;
    images?: Array<{
        id: number;
        image_url: string;
        display_order: number;
    }>;
    seller?: {
        id: number;
        name: string;
    };
}

interface ProductDetailPageProps {
    productId: string;
    setRoute: (route: string) => void;
    onCartUpdate?: () => void;
}

interface Categories {
    [key: string]: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, setRoute, onCartUpdate }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Categories>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSubCategories, setShowSubCategories] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHoveringImage, setIsHoveringImage] = useState(false);

    useEffect(() => {
        fetchProduct();
        fetchCategories();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setError('제품을 찾을 수 없습니다.');
                } else {
                    throw new Error('상품을 불러오는데 실패했습니다.');
                }
                return;
            }
            const data = await response.json();
            setProduct(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
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

    const addToCart = async () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        setIsAddingToCart(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: parseInt(productId),
                    quantity: 1
                })
            });

            if (!response.ok) {
                throw new Error('장바구니 추가에 실패했습니다.');
            }

            alert('장바구니에 추가되었습니다!');
            
            if (onCartUpdate) {
                setTimeout(() => onCartUpdate(), 100);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const buyNow = () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!product) return;

        const orderItem = {
            id: Date.now(),
            product_id: product.id,
            quantity: 1,
            product: product
        };

        sessionStorage.setItem('orderItems', JSON.stringify([orderItem]));
        setRoute('order');
        window.location.hash = 'order';
    };

    const goBackToProducts = () => {
        setRoute('products');
        window.location.hash = 'products';
    };

    const goToProductsWithCategory = (mainCategory: string, subCategory?: string) => {
        // 카테고리 상태 저장
        sessionStorage.setItem('productsPageState', JSON.stringify({
            category: mainCategory,
            subCategory: subCategory || '전체',
            search: '',
            page: 1
        }));
        setRoute('products');
        window.location.hash = 'products';
    };

    const getProductImages = () => {
        if (!product) return [];
        if (product.images && product.images.length > 0) {
            return product.images.map(img => img.image_url);
        }

        return [product.image_url];
    };

    const handlePrevImage = () => {
        const images = getProductImages();
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        console.log(getProductImages()[0]);
        console.log("getProductImages():", getProductImages());
    };

    const handleNextImage = () => {
        const images = getProductImages();
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">{error || '제품을 찾을 수 없습니다.'}</h2>
                <a 
                    href="#products" 
                    onClick={(e) => { e.preventDefault(); setRoute('products'); }} 
                    className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block"
                >
                    &larr; 제품 목록으로 돌아가기
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* 카테고리 바 (상단 고정) */}
            <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* 대분류 카테고리 */}
                    <div className="flex overflow-x-auto py-3 space-x-4 scrollbar-hide">
                        <button
                            onClick={goBackToProducts}
                            className="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            전체
                        </button>
                        {Object.keys(categories).map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    if (product && product.category_main === category && categories[category]?.length > 0) {
                                        setShowSubCategories(!showSubCategories);
                                    } else {
                                        goToProductsWithCategory(category);
                                    }
                                }}
                                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                                    product && product.category_main === category
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* 소분류 카테고리 */}
                    {product && showSubCategories && categories[product.category_main]?.length > 0 && (
                        <div className="flex overflow-x-auto py-3 space-x-2 border-t scrollbar-hide">
                            <button
                                onClick={() => goToProductsWithCategory(product.category_main)}
                                className="px-3 py-1 rounded-full text-sm whitespace-nowrap text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                전체
                            </button>
                            {categories[product.category_main].map((subCategory) => (
                                <button
                                    key={subCategory}
                                    onClick={() => goToProductsWithCategory(product.category_main, subCategory)}
                                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                                        product.category_sub === subCategory
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

            <div className="max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
                    {/* Image gallery */}
                    <div>
                        {/* 메인 이미지 */}
                        <div 
                            className="relative w-full bg-gray-100 rounded-lg overflow-hidden mb-4"
                            style={{ aspectRatio: '1/1' }}
                            onMouseEnter={() => setIsHoveringImage(true)}
                            onMouseLeave={() => setIsHoveringImage(false)}
                        >
                            <img 
                                src={getProductImages()[currentImageIndex]?.startsWith('http') 
                                    ? getProductImages()[currentImageIndex] 
                                    : `${API_BASE_URL}${getProductImages()[currentImageIndex]}`}
                                alt={product.name} 
                                className="w-full h-full object-contain" 
                            />
                            
                            {/* 이미지가 2개 이상일 때만 화살표 표시 */}
                            {getProductImages().length > 1 && isHoveringImage && (
                                <>
                                    <button
                                        onClick={handlePrevImage}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-opacity text-2xl"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-opacity text-2xl"
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </div>

                        {/* 썸네일 이미지들 */}
                        {getProductImages().length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {getProductImages().map((imgUrl, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`relative w-full bg-gray-100 rounded-md overflow-hidden border-2 transition-all ${
                                            currentImageIndex === index 
                                                ? 'border-indigo-600 ring-2 ring-indigo-600' 
                                                : 'border-transparent hover:border-gray-400'
                                        }`}
                                        style={{ aspectRatio: '1/1' }}
                                    >
                                        <img 
                                            src={imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`}
                                            alt={`${product.name} ${index + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product info */}
                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <a 
                            href="#products" 
                            onClick={(e) => { e.preventDefault(); goBackToProducts(); }} 
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 inline-block"
                        >
                           &larr; 돌아가기
                        </a>

                        {/* 카테고리 배지 */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                {product.category_main}
                            </span>
                            {product.category_sub && (
                                <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                                    {product.category_sub}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
                        {product.seller && (
                            <p className="mt-2 text-sm text-gray-600">
                                판매자: <span className="font-medium text-gray-900">{product.seller.name}</span>
                            </p>
                        )}
                        <div className="mt-3">
                            <p className="text-3xl text-gray-900">{product.price}</p>
                        </div>
                        <div className="mt-6">
                            <h3 className="sr-only">Description</h3>
                            <div className="text-base text-gray-700 space-y-6">
                                <p>{product.description}</p>
                            </div>
                        </div>
                        <div className="mt-10 flex space-x-4">
                            <button 
                                onClick={addToCart}
                                disabled={isAddingToCart}
                                className="flex-1 bg-white border-2 border-indigo-600 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:border-indigo-400 disabled:text-indigo-400"
                            >
                                {isAddingToCart ? '추가 중...' : '장바구니에 추가'}
                            </button>
                            <button 
                                onClick={buyNow}
                                className="flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                바로 주문
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;