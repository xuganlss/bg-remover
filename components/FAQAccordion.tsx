'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How many free credits do I get?',
    answer: 'You get 3 free credits when you sign up. Each credit removes the background from one image.',
  },
  {
    question: 'Do credits expire?',
    answer: 'No! Purchased credits never expire. Use them whenever you need, at your own pace.',
  },
  {
    question: 'What image formats are supported?',
    answer: 'We support JPG, PNG, WebP, and most common image formats. Maximum file size is 10MB.',
  },
  {
    question: 'How long does background removal take?',
    answer: 'Typically 2-5 seconds depending on image size and complexity. AI processes your image instantly.',
  },
  {
    question: 'Are my images stored or shared?',
    answer: 'No. Your images are processed in real-time and never stored on our servers. Your privacy is our priority.',
  },
  {
    question: 'Can I get a refund if I\'m not satisfied?',
    answer: 'Yes! Contact us within 7 days of purchase if you\'re not satisfied. We offer full refunds for unused credits.',
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto mt-16">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
        Frequently Asked Questions
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Everything you need to know about BGRemover
      </p>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-purple-200 hover:shadow-md"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-800 pr-4">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-purple-600 transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openIndex === index ? 'max-h-48' : 'max-h-0'
              }`}
            >
              <div className="px-6 pb-4 pt-2 text-gray-600 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
