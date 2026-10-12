import { Music2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-slate-800 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
        <Music2 className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Yoinks Music</h1>
      <p className="text-sm text-slate-500 max-w-xs">
        Senior-friendly high taste mobile music player and discography discovery
      </p>
    </div>
  );
}
