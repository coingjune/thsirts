import React, { useState } from 'react';

interface SellerRegisterPageProps {
    setRoute: (route: string) => void;
    refreshUser: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const SellerRegisterPage: React.FC<SellerRegisterPageProps> = ({ setRoute, refreshUser }) => {
    const [sellerName, setSellerName] = useState('');
    const [kakaopayLink, setKakaopayLink] = useState('');
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

        if (!sellerName || !kakaopayLink) {
            alert('판매자명과 카카오페이 링크를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const formData = new FormData();
            formData.append('name', sellerName);
            formData.append('kakaopay_link', kakaopayLink);
            if (qrImage) {
                formData.append('qr_image', qrImage);
            }

            const response = await fetch(`${API_BASE_URL}/api/sellers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '판매자 등록에 실패했습니다.');
            }

            await refreshUser();

            alert('판매자 등록이 완료되었습니다!');
            setRoute('seller-dashboard');
            window.location.hash = 'seller-dashboard';
        } catch (err) {
            alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">판매자 등록</h1>
                    <p className="text-gray-600 mb-8">판매자로 등록하여 상품을 판매할 수 있습니다.</p>

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
                                placeholder="예: T-Style 공식스토어"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">고객에게 표시될 판매자 이름입니다.</p>
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
                                placeholder="https://qr.kakaopay.com/..."
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">고객이 결제할 카카오페이 링크입니다.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카카오페이 QR 코드 이미지 (선택)
                            </label>
                            <div className="mt-2 flex items-center gap-4">
                                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                    <span className="text-sm text-gray-700">파일 선택</span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                                {qrImage && <span className="text-sm text-gray-600">{qrImage.name}</span>}
                            </div>
                            {preview && (
                                <div className="mt-4">
                                    <img src={preview} alt="QR 미리보기" className="w-48 h-48 object-contain border rounded-md" />
                                </div>
                            )}
                            <p className="mt-1 text-sm text-gray-500">PNG 또는 JPG 파일을 업로드하세요.</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setRoute('home');
                                    window.location.hash = 'home';
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 font-medium"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium disabled:bg-indigo-400"
                            >
                                {isSubmitting ? '등록 중...' : '판매자 등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellerRegisterPage;