"use client";

interface LoadingIndicatorProps {
  loading: boolean;
  hasData: boolean;
}

export default function LoadingIndicator({ loading, hasData }: LoadingIndicatorProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No data available. Check your backend connection.
        </p>
      </div>
    );
  }

  return null;
}
