'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-6">📶</p>
        <h1 className="text-2xl font-bold mb-3">Você está offline</h1>
        <p className="text-gray-400 mb-8">Seus dados salvos ainda estão disponíveis</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all active:scale-95"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
