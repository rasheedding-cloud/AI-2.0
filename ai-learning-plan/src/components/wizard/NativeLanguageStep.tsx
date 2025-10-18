'use client';

import React, { useState, useMemo } from 'react';
import { WizardStepProps } from '@/types/intake';
import { NATIVE_LANGUAGES } from '@/constants/intake';

export const NativeLanguageStep: React.FC<WizardStepProps> = ({
  value,
  onChange,
  onNext,
  onPrevious,
  errors,
  isFirstStep,
  isLastStep,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedLanguage = value as string;
  const hasError = errors.some(e => e.field === 'nativeLanguage');

  const filteredLanguages = useMemo(() => {
    if (!searchTerm) return NATIVE_LANGUAGES;

    const term = searchTerm.toLowerCase();
    return NATIVE_LANGUAGES.filter(lang =>
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      lang.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const selectedLanguageData = NATIVE_LANGUAGES.find(lang => lang.code === selectedLanguage);

  const handleLanguageSelect = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
    setTimeout(() => onNext(), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        {/* 自定义下拉选择器 */}
        <div className="relative">
          <label
            htmlFor="language-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            请选择您的母语
          </label>

          <button
            id="language-select"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`
              relative w-full px-4 py-3 text-left bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
              ${hasError ? 'border-red-300' : 'border-gray-300'}
              ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby="language-select-label"
          >
            <div className="flex items-center justify-between">
              <span className={selectedLanguage ? 'text-gray-900' : 'text-gray-500'}>
                {selectedLanguageData ? selectedLanguageData.nativeName : '请选择母语...'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* 下拉菜单 */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
              {/* 搜索框 */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索语言..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* 语言列表 */}
              <div className="max-h-80 overflow-y-auto">
                {filteredLanguages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    没有找到匹配的语言
                  </div>
                ) : (
                  <ul role="listbox" className="py-1">
                    {filteredLanguages.map((language) => (
                      <li key={language.code}>
                        <button
                          type="button"
                          onClick={() => handleLanguageSelect(language.code)}
                          className={`
                            w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150
                            ${selectedLanguage === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
                          `}
                          role="option"
                          aria-selected={selectedLanguage === language.code}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{language.nativeName}</div>
                              <div className="text-sm text-gray-500">{language.name}</div>
                            </div>
                            {selectedLanguage === language.code && (
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {hasError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {errors.find(e => e.field === 'nativeLanguage')?.message}
            </p>
          </div>
        )}

        {/* 已选择的语言显示 */}
        {selectedLanguageData && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  已选择母语：{selectedLanguageData.nativeName}
                </p>
                <p className="text-xs text-blue-700">
                  {selectedLanguageData.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            🌍 选择您的母语有助于我们为您定制更合适的学习方法
          </p>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="mt-8 flex justify-between">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            上一步
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedLanguage}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${selectedLanguage
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          下一步
        </button>
      </div>
    </div>
  );
};