/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Analytics} from '@vercel/analytics/react';
import NasaApod from './components/NasaApod';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NasaApod />
      <Analytics />
    </div>
  );
}
