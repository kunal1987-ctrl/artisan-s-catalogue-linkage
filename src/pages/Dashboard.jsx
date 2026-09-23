import React, { useState } from 'react';
import HaatEventCard from '../components/HaatEventCard';

export default function Dashboard() {
  const [selectedLanguage] = useState(
    () => localStorage.getItem('app_lang') || 'hi'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Live Government Haats & Melas Smart Dashboard Component */}
      <HaatEventCard currentLang={selectedLanguage || 'hi'} />

      {/* Catalog & Inventory Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">हस्तशिल्प उत्पाद एवं कैटलॉग (Products & Catalog)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Product cards mount here */}
        </div>
      </div>
    </div>
  );
}
