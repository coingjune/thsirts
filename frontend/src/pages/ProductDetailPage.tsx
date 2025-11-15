import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductDetailPageProps {
    productId: string;
    setRoute: (route: string) => void;
    onCartUpdate: () => void;
}

interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
    image_url: string;
    category_main: string;
    category_sub?: string;
    seller?: { id: number; name: string };
    images?: Array<{ image_url: string; display_order: number }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, setRoute, onCartUpdate }) => {
    const { t } = useTranslation();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [categories, setCategories] = useState<Record<string, string[]>>({});
    const [showSubCategories, setShowSubCategories] = useState(false);
    const [isHoveringImage, setIsHoveringImage] = useState(false);

    useEffect(() => {
        fetchProduct();
        fetchCategories();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
            if (!response.ok) throw new Error(t('productDetail.notFound'));
            const data = await response.json();
            setProduct(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error'));
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
            console.error('Category fetch failed:', err);
        }
    };

    const getProductImages = () => {
        if (!product) return [];
        if (product.images && product.images.length > 0) {
            return product.images
                .sort((a, b) => a.display_order - b.display_order)
                .map(img => img.image_url);
        }
        return [product.image_url];
    };

    const addToCart = async () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
            alert(t('productDetail.loginRequired'));
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
                    product_id: product?.id,
                    quantity: 1
                })
            });

            if (!response.ok) throw new Error(t('common.error'));
            
            alert(t('productDetail.addedToCart'));
            onCartUpdate();
        } catch (err) {
            alert(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setIsAddingToCart(false);
        }
    };

    const buyNow = async () => {
        await addToCart();
        setRoute('cart');
        window.location.hash = 'cart';
    };

    const goBackToProducts = () => {
        setRoute('products');
        window.location.hash = 'products';
    };

    const goToProductsWithCategory = (mainCategory: string, subCategory?: string) => {
        sessionStorage.setItem('productsPageState', JSON.stringify({
            category: mainCategory,
            subCategory: subCategory || '전체',
            search: '',
            page: 1
        }));
        setRoute('products');
        window.location.hash = 'products';
    };

    const getCategoryName = (key: string) => {
        return t(`categories.${key}`, { defaultValue: key });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('productDetail.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">{error || t('productDetail.notFound')}</h2>
                <a 
                    href="#products" 
                    onClick={(e) => { e.preventDefault(); setRoute('products'); }} 
                    className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block"
                >
                    &larr; {t('products.title')}
                </a>
            </div>
        );
    }

    const productImages = getProductImages();

    return (
        <div className="bg-white">
            <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto py-3 space-x-4 scrollbar-hide">
                        <button
                            onClick={goBackToProducts}
                            className="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            {t('products.all')}
                        </button>
                        {Object.keys(categories).map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    if (product.category_main === category && categories[category]?.length > 0) {
                                        setShowSubCategories(!showSubCategories);
                                    } else {
                                        goToProductsWithCategory(category);
                                    }
                                }}
                                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                                    product.category_main === category
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {getCategoryName(category)}
                            </button>
                        ))}
                    </div>

                    {showSubCategories && categories[product.category_main]?.length > 0 && (
                        <div className="flex overflow-x-auto py-3 space-x-2 border-t scrollbar-hide">
                            <button
                                onClick={() => goToProductsWithCategory(product.category_main)}
                                className="px-3 py-1 rounded-full text-sm whitespace-nowrap text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                {t('products.all')}
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
                                    {getCategoryName(subCategory)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
                    <div>
                        <div 
                            className="relative w-full bg-gray-100 rounded-lg overflow-hidden mb-4"
                            style={{ aspectRatio: '1/1' }}
                            onMouseEnter={() => setIsHoveringImage(true)}
                            onMouseLeave={() => setIsHoveringImage(false)}
                        >
                            <img 
                                src={productImages[currentImageIndex]?.startsWith('http') 
                                    ? productImages[currentImageIndex]
                                    : `${API_BASE_URL}${productImages[currentImageIndex]}`}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />

                            {productImages.length > 1 && isHoveringImage && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                                    >
                                        →
                                    </button>
                                </>
                            )}
                        </div>

                        {productImages.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {productImages.map((imgUrl, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`border-2 rounded-lg overflow-hidden ${
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

                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <a 
                            href="#products" 
                            onClick={(e) => { e.preventDefault(); goBackToProducts(); }} 
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 inline-block"
                        >
                           &larr; {t('products.title')}
                        </a>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                {getCategoryName(product.category_main)}
                            </span>
                            {product.category_sub && (
                                <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                                    {getCategoryName(product.category_sub)}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
                        {product.seller && (
                            <p className="mt-2 text-sm text-gray-600">
                                {t('productDetail.seller')}: <span className="font-medium text-gray-900">{product.seller.name}</span>
                            </p>
                        )}
                        <div className="mt-3">
                            <p className="text-3xl text-gray-900">{product.price}</p>
                        </div>
                        <div className="mt-6">
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
                                {isAddingToCart ? t('productDetail.adding') : t('productDetail.addToCart')}
                            </button>
                            <button 
                                onClick={buyNow}
                                className="flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('productDetail.buyNow')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;