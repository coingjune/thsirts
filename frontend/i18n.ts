import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 브라우저에 저장된 언어가 있으면 사용, 없으면 기본값은 한국어
const savedLng = (typeof window !== 'undefined' && window.localStorage.getItem('lng')) || 'ko';

const resources = {
  ko: {
    translation: {
      brand: 'POV SEOUL',
      nav: {
        home: '메인',
        products: '제품',
        mypage: '마이페이지',
        cart: '장바구니',
        login: '로그인',
        signup: '회원가입',
        greeting: '안녕하세요, {{name}}님!',
      },
      footer: {
        copyright: '© {{year}} POV SEOUL. All rights reserved.',
      },
      home: {
        title: 'POV SEOUL',
        subtitle: 'Find Your Seoul.',
        cta: '지금 쇼핑하기',
      },
      auth: {
        titleLogin: '로그인',
        titleSignup: '회원가입',
        nameLabel: '이름',
        emailLabel: '이메일 주소',
        passwordLabel: '비밀번호',
        submitLogin: '로그인',
        submitSignup: '회원가입',
        or: '또는',
        haveNoAccount: '계정이 없으신가요?',
        haveAccount: '이미 계정이 있으신가요?',
        goSignup: '회원가입',
        goLogin: '로그인',
        errorRequired: '모든 필드를 입력해주세요.',
        errorAuthFailed: '인증에 실패했습니다. 다시 시도해주세요.',
        errorGoogleFailed: '구글 로그인에 실패했습니다.',
      },
    },
  },
  en: {
    translation: {
      brand: 'POV SEOUL',
      nav: {
        home: 'Home',
        products: 'Products',
        mypage: 'My Page',
        cart: 'Cart',
        login: 'Log In',
        signup: 'Sign Up',
        greeting: 'Hello, {{name}}!',
      },
      footer: {
        copyright: '© {{year}} POV SEOUL. All rights reserved.',
      },
      home: {
        title: 'POV SEOUL',
        subtitle: 'Find Your Seoul.',
        cta: 'Shop Now',
      },
      auth: {
        titleLogin: 'Log In',
        titleSignup: 'Sign Up',
        nameLabel: 'Name',
        emailLabel: 'Email Address',
        passwordLabel: 'Password',
        submitLogin: 'Log In',
        submitSignup: 'Sign Up',
        or: 'OR',
        haveNoAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        goSignup: 'Sign Up',
        goLogin: 'Log In',
        errorRequired: 'Please fill in all fields.',
        errorAuthFailed: 'Authentication failed. Please try again.',
        errorGoogleFailed: 'Google login failed.',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLng,
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false, // React는 XSS를 자체 방어하므로 escape 불필요
    },
  });

// 언어 변경 시 로컬스토리지에 저장
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('lng', lng);
  }
});

export default i18n;


