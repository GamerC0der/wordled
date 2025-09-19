'use client';
import { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';

type S = 'correct' | 'present' | 'absent' | 'empty';
type G = { char: string; state: S }[];

export default function Home() {
  const [t, sT] = useState('');
  const [g, sG] = useState<G[]>([]);
  const [c, sC] = useState('');
  const [st, sSt] = useState<'playing' | 'won' | 'lost'>('playing');
  const [wL, sWL] = useState<string[]>([]);
  const [l, sL] = useState(true);
  const [e, sE] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMathMode, setIsMathMode] = useState(false);

  const WL = isMathMode ? 8 : 5;
  const MG = 6;
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, []);

  const fW = useCallback(async () => {
    try {
      sL(true);
      sE(null);

      const mathMode = Math.random() < 0.33;
      setIsMathMode(mathMode);

      const fileName = mathMode ? '/math-expressions.txt' : '/common-words.txt';
      const response = await fetch(fileName);
      const text = await response.text();
      const words = text.split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length === (mathMode ? 8 : 5) && word.length > 0);

      const allWords = [...new Set(words)];


      sWL(allWords);

      if (allWords.length === 0) {
        throw new Error(`No ${mathMode ? 'equations' : 'words'} loaded`);
      }

      const selectedWord = allWords[Math.floor(Math.random() * allWords.length)];
      sT(selectedWord);

      console.log(`${mathMode ? '🔢' : '🎯'} Selected target ${mathMode ? 'equation' : 'word'}:`, selectedWord);
      console.log('📚 Word list generated with', allWords.length, mathMode ? 'equations' : 'words');
    } catch (error) {
      console.error('Failed to load words:', error);
      sE('Failed to load words from file');
    } finally {
      sL(false);
    }
  }, []);

  const r = useCallback(async () => {
    await fW();
    sG([]);
    sC('');
    sSt('playing');
    setShowModal(false);
    sE(null);
  }, [fW, sE]);

  const ch = useCallback((guess: string): G => {
    const r: G = [], tt = [...t];
    guess.split('').forEach((l, i) => {
      if (l === tt[i]) {
        r[i] = { char: l, state: 'correct' };
        tt[i] = '';
      } else r[i] = { char: l, state: 'empty' };
    });
    r.forEach((l, i) => {
      if (l.state === 'empty') {
        const idx = tt.indexOf(l.char);
        r[i] = idx !== -1 ? { char: l.char, state: 'present' } : { char: l.char, state: 'absent' };
        if (idx !== -1) tt[idx] = '';
      }
    });
    return r;
  }, [t]);

  const validateMathExpression = useCallback((expression: string): boolean => {
    if (!isMathMode) return wL.includes(expression);

    // In math mode, just check if it looks like a math expression
    // Allow any combination of numbers, operators, and equals sign
    return /^[0-9+\-*/=]+$/.test(expression) && expression.length === 8;
  }, [isMathMode, wL]);

  const sub = useCallback(() => {
    if (c.length !== WL || st !== 'playing') return;

    if (!validateMathExpression(c)) {
      sE(isMathMode ? 'Use only numbers and math operators!' : 'Not a valid word!');
      return;
    }

    sE(null);
    const ng = ch(c);
    const ngs = [...g, ng];
    sG(ngs);
    sC('');
    const newState = ng.every(l => l.state === 'correct') ? 'won' : ngs.length === MG ? 'lost' : 'playing';
    sSt(newState);
    if (newState !== 'playing') {
      setShowModal(true);
    }
  }, [c, g, st, ch, validateMathExpression, sE, isMathMode, WL, MG]);

  const co = (s: S) =>
    clsx({
      'bg-green-500': s === 'correct',
      'bg-yellow-500': s === 'present',
      'bg-gray-500': s === 'absent',
      'bg-gray-700': s === 'empty',
    });

  const ro = (guess: G | null, isC = false) => (
    <div className="flex gap-2 mb-2 justify-center">
      {Array(WL).fill(0).map((_, i) => {
        const l = guess ? guess[i] : { char: isC ? c[i] || '' : '', state: 'empty' as S };
        return (
          <div
            key={i}
            className={clsx(
              'w-16 h-16 border-2 flex items-center justify-center text-white font-bold text-3xl uppercase',
              l.state === 'empty' ? 'border-gray-600 bg-gray-800' : co(l.state)
            )}
          >
            {l.char}
          </div>
        );
      })}
    </div>
  );


  const GameModal = ({ isMathMode }: { isMathMode: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <h2 className="text-3xl font-bold mb-4 text-white">
          {st === 'won' ? '🎉 Congratulations!' : '😢 Game Over'}
        </h2>
        <p className="text-lg mb-4 text-gray-300">
          {st === 'won'
            ? `You guessed the ${isMathMode ? 'equation' : 'word'} correctly!`
            : `You couldn't guess the ${isMathMode ? 'equation' : 'word'} in ${MG} tries.`
          }
        </p>
        <p className="text-xl mb-6 text-white font-mono font-bold">
          The {isMathMode ? 'equation' : 'word'} was: <span className="text-blue-400">{t}</span>
        </p>
        <button
          onClick={() => r().catch(error => console.error('Failed to reset game:', error))}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Play Again
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    console.log('🚀 Initializing word fetching...');
    fW().catch(error => {
      console.error('Failed to initialize word fetching:', error);
    });
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      const isValidKey = k === 'ENTER' || k === 'BACKSPACE' ||
        (isMathMode ? /^[0-9+\-*/=]$/.test(k) : /^[A-Z]$/.test(k));

      if (isValidKey) {
        e.preventDefault();
        if (k === 'ENTER') sub();
        else if (k === 'BACKSPACE') {
          sC(p => p.slice(0, -1));
          sE(null);
        }
        else if (c.length < WL) {
          sC(p => p + k);
          sE(null);
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [c, st, sub, sE, isMathMode, WL]);

  if (l) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-8">{isMathMode ? 'MATHLED' : 'WORDLED'}</h1>
          <div className="text-xl mb-4">Loading {isMathMode ? 'equations' : 'words'}...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (e && wL.length === 0) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-8">{isMathMode ? 'MATHLED' : 'WORDLED'}</h1>
          <div className="text-red-400 mb-4">{e}</div>
          <button
            onClick={fW}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">

      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8">
          {isMathMode ? 'MATHLED' : 'WORDLED'}
        </h1>
        {isMathMode && (
          <p className="text-center text-yellow-400 mb-4 text-sm">
            🔢 Create any math expression using numbers and operators!
          </p>
        )}
        {e && (
          <div className="text-yellow-400 text-center mb-4 text-sm">
            {e}
          </div>
        )}
        <div className="mb-8">
          {Array(MG).fill(0).map((_, i) =>
            i < g.length ? ro(g[i]) : i === g.length ? ro(null, true) : ro(null)
          )}
        </div>
      </div>

      {showModal && <GameModal isMathMode={isMathMode} />}
    </div>
  );
}
