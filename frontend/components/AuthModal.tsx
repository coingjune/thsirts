import React, { useState } from 'react';
import { User } from '../App';

interface AuthModalProps {
    type: 'login' | 'signup';
    onClose: () => void;
    onLogin: (user: User & { password: string }) => Promise<void>;
    onSignup: (user: User & { password: string }) => Promise<void>;
    switchType: (type: 'login' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ type, onClose, onLogin, onSignup, switchType }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const isLogin = type === 'login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!isLogin && !name) || !email || !password) {
            setError('모든 필드를 입력해주세요.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                await onLogin({ name: email.split('@')[0], email, password });
            } else {
                await onSignup({ name, email, password });
            }
        } catch (err) {
            setError('인증에 실패했습니다. 다시 시도해주세요.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{isLogin ? '로그인' : '회원가입'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                    )}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일 주소</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 flex justify-center items-center">
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (isLogin ? '로그인' : '회원가입')}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                    {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                    <button onClick={() => switchType(isLogin ? 'signup' : 'login')} className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
                        {isLogin ? '회원가입' : '로그인'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;