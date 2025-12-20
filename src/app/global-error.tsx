'use client'

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Something went wrong!</h1>
          <p>We apologize for the inconvenience. Please try again later.</p>
          <button onClick={() => reset()}>Try again</button>
          {/* <pre>{error.message}</pre> */} 
        </div>
      </body>
    </html>
  );
}
