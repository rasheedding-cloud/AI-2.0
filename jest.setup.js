// Jest测试环境设置
import '@testing-library/jest-dom';

// 模拟环境变量
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.FEATURE_GOAL_ASSESSOR_V2 = 'false';
process.env.GOAL_ASSESSOR_SHADOW = 'true';

// 模拟fetch
global.fetch = jest.fn();

// 模拟window对象
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true,
});

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟console方法以避免测试输出干扰
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});