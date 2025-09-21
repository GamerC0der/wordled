'use client';
import { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { Target, Calculator, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';

const Globe3D = dynamic(() => import('../components/Globe'), { ssr: false });

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
  const [flippingRow, setFlippingRow] = useState<number | null>(null);
  const [flippingTiles, setFlippingTiles] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set());
  const [fadingTiles, setFadingTiles] = useState<Set<string>>(new Set());
  const [letterStates, setLetterStates] = useState<Record<string, S>>({});
  const [gameMode, setGameMode] = useState<'wordle' | 'mathle' | 'geoword' | null>(null);
  const [showModeModal, setShowModeModal] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    wordGamesPlayed: 0,
    wordGamesWon: 0,
    mathGamesPlayed: 0,
    mathGamesWon: 0,
    geoGamesPlayed: 0,
    geoGamesWon: 0,
  });
  const [guessedCountries, setGuessedCountries] = useState<string[]>([]);

  const WL = gameMode === 'mathle' ? 8 : gameMode === 'geoword' ? 6 : 5;
  const MG = 6;
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });

      const savedStats = localStorage.getItem('wordleStats');
      if (savedStats) {
        try {
          setGameStats(JSON.parse(savedStats));
        } catch (error) {
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wordleStats', JSON.stringify(gameStats));
    }
  }, [gameStats]);

  const selectEasiestWord = useCallback(async (wordList: string[]): Promise<string> => {
    if (wordList.length < 5) {
      return wordList[Math.floor(Math.random() * wordList.length)];
    }

    const shuffled = [...wordList].sort(() => 0.5 - Math.random());
    const candidates = shuffled.slice(0, 5);

    try {
      const response = await fetch('https://ai.hackclub.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2-instruct-0905',
          messages: [
            {
              role: 'system',
              content: 'You are a word selection assistant. Given a list of 5 words, select the one that would be easiest to guess in a word guessing game. Choose the most common, familiar word that people would think of first. Respond with ONLY the selected word, nothing else.'
            },
            {
              role: 'user',
              content: `Select the easiest word to guess from these 5 options: ${candidates.join(', ')}`
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const selectedWord = data.choices?.[0]?.message?.content?.trim();

      if (selectedWord && candidates.includes(selectedWord.toUpperCase())) {
        return selectedWord.toUpperCase();
      } else {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    } catch (error) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }, []);

  const fW = useCallback(async (mode?: 'wordle' | 'mathle' | 'geoword') => {
    const startTime = Date.now();
    try {
      sL(true);
      sE(null);

      if (mode !== undefined) {
        setGameMode(mode);
      }

      const fileName = gameMode === 'mathle' ? '/math-expressions.txt' :
                      gameMode === 'geoword' ? '/countries.txt' : '/common-words.txt';
      const response = await fetch(fileName);
      const text = await response.text();
      const words = text.split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length === WL && word.length > 0);

      const allWords = [...new Set(words)];
      sWL(allWords);
      if (allWords.length === 0) {
        throw new Error(`No ${gameMode === 'mathle' ? 'equations' : gameMode === 'geoword' ? 'countries' : 'words'} loaded`);
      }
      const selectedWord = gameMode === 'mathle'
        ? allWords[Math.floor(Math.random() * allWords.length)]
        : await selectEasiestWord(allWords);

      sT(selectedWord);
    } catch (error) {
      sE('Failed to load words from file');
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      setTimeout(() => sL(false), remainingTime);
    }
  }, [selectEasiestWord, gameMode, WL]);

  const selectMode = useCallback(async (mode: 'wordle' | 'mathle' | 'geoword') => {
    setGameMode(mode);
    setShowModeModal(false);
    await fW(mode);
  }, [fW]);

  const r = useCallback(async () => {
    await fW();
    sG([]);
    sC('');
    sSt('playing');
    setShowModal(false);
    sE(null);
    setFlippingRow(null);
    setFlippingTiles(new Set());
    setRevealedTiles(new Set());
    setFadingTiles(new Set());
    setLetterStates({});
    setGuessedCountries([]);
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

  const validateGuess = useCallback((guess: string): boolean => {
    if (gameMode === 'mathle') return /^[0-9+\-×÷=]+$/.test(guess) && guess.length === 8;
    if (gameMode === 'geoword') return wL.includes(guess);
    return wL.includes(guess);
  }, [gameMode, wL]);

  const handleCountrySelect = useCallback((countryName: string) => {
    if (gameMode !== 'geoword' || st !== 'playing') return;

    if (guessedCountries.includes(countryName)) {
      setToastMessage('Country already guessed!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const newGuessedCountries = [...guessedCountries, countryName];
    setGuessedCountries(newGuessedCountries);

    const isCorrect = countryName === t;
    const newAttempts = newGuessedCountries.length;
    const newState = isCorrect ? 'won' : newAttempts === MG ? 'lost' : 'playing';

    sSt(newState);

    if (newState !== 'playing') {
      setGameStats(prev => {
        const isWin = newState === 'won';
        const newStats = {
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + (isWin ? 1 : 0),
          currentStreak: isWin ? prev.currentStreak + 1 : 0,
          maxStreak: isWin ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
          wordGamesPlayed: prev.wordGamesPlayed,
          wordGamesWon: prev.wordGamesWon,
          mathGamesPlayed: prev.mathGamesPlayed,
          mathGamesWon: prev.mathGamesWon,
          geoGamesPlayed: prev.geoGamesPlayed + 1,
          geoGamesWon: prev.geoGamesWon + (isWin ? 1 : 0),
        };
        return newStats;
      });
      setShowModal(true);
    }
  }, [gameMode, st, guessedCountries, t, MG, sSt, setGameStats, setShowModal]);

  const sub = useCallback(() => {
    if (c.length !== WL || st !== 'playing') return;

    if (c === 'ANSWO') {
      console.log('🎯 Target word:', t);
      sC('');
      return;
    }

    if (!validateGuess(c)) {
      const errorMsg = gameMode === 'mathle' ? 'Use only numbers and math operators!' :
                      gameMode === 'geoword' ? 'Not a valid country!' : 'Not a valid word!';
      setToastMessage(errorMsg);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const ng = ch(c);
    const ngs = [...g, ng];
    sG(ngs);
    sC('');

    const currentRowIndex = g.length;
    setFlippingRow(currentRowIndex);
    setFlippingTiles(new Set());

    for (let i = 0; i < WL; i++) {
      setTimeout(() => {
        setFlippingTiles(prev => new Set([...prev, i]));
        setTimeout(() => {
          setRevealedTiles(prev => new Set([...prev, `${currentRowIndex}-${i}`]));
        }, 600);
      }, i * 150);
    }

    setTimeout(() => {
      setFlippingRow(null);
      setFlippingTiles(new Set());
    }, WL * 150 + 600);

    const newLetterStates = { ...letterStates };
    ng.forEach((letter, index) => {
      const currentState = newLetterStates[letter.char];
      if (!currentState || currentState !== 'correct' as S) {
        if (letter.state === 'correct') {
          newLetterStates[letter.char] = 'correct';
        } else if (letter.state === 'present' && (!currentState || currentState !== 'correct' as S)) {
          newLetterStates[letter.char] = 'present';
        } else if (letter.state === 'absent' && !currentState) {
          newLetterStates[letter.char] = 'absent';
        }
      }
    });
    setLetterStates(newLetterStates);

    const newState = ng.every(l => l.state === 'correct') ? 'won' : ngs.length === MG ? 'lost' : 'playing';
    sSt(newState);

    if (newState !== 'playing') {
      setGameStats(prev => {
        const isWin = newState === 'won';
        const newStats = {
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + (isWin ? 1 : 0),
          currentStreak: isWin ? prev.currentStreak + 1 : 0,
          maxStreak: isWin ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
          wordGamesPlayed: prev.wordGamesPlayed + (gameMode === 'wordle' ? 1 : 0),
          wordGamesWon: prev.wordGamesWon + (gameMode === 'wordle' && isWin ? 1 : 0),
          mathGamesPlayed: prev.mathGamesPlayed + (gameMode === 'mathle' ? 1 : 0),
          mathGamesWon: prev.mathGamesWon + (gameMode === 'mathle' && isWin ? 1 : 0),
          geoGamesPlayed: prev.geoGamesPlayed + (gameMode === 'geoword' ? 1 : 0),
          geoGamesWon: prev.geoGamesWon + (gameMode === 'geoword' && isWin ? 1 : 0),
        };
        return newStats;
      });

      setShowModal(true);
    }
  }, [c, g, st, ch, validateGuess, gameMode, WL, MG]);

  const co = (s: S) =>
    clsx({
      'bg-green-500': s === 'correct',
      'bg-yellow-500': s === 'present',
      'bg-gray-500': s === 'absent',
      'bg-gray-700': s === 'empty',
    });

  const getKeyboardLayout = () => {
    if (gameMode === 'mathle') {
      return [
        ['7', '8', '9', '×', '÷'],
        ['4', '5', '6', '+', '-'],
        ['1', '2', '3', '='],
        ['0', 'ENTER', 'BACKSPACE']
      ];
    } else {
      return [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
      ];
    }
  };

  const Toast = () => {
    if (!toastMessage) return null;

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-red-500 text-center font-semibold text-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">!</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      </div>
    );
  };

  const VirtualKeyboard = () => {
    const layout = getKeyboardLayout();

    const handleKeyClick = (key: string) => {
      if (key === 'ENTER') {
        sub();
      } else if (key === 'BACKSPACE') {
        sC(p => p.length > 0 ? p.slice(0, -1) : p);
      } else if (c.length < WL) {
        const currentLength = c.length;
        sC(p => p + key);
        const tileKey = `${g.length}-${currentLength}`;
        setFadingTiles(prev => new Set([...prev, tileKey]));
        setTimeout(() => {
          setFadingTiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(tileKey);
            return newSet;
          });
        }, 200);
      }
    };

    return (
      <div className="w-full max-w-md mx-auto mt-8">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 mb-2">
            {row.map((key) => {
              const state = letterStates[key] || 'empty';
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';

              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={clsx(
                    'h-12 px-2 rounded font-bold text-sm transition-colors border border-gray-600',
                    isSpecial ? 'px-4 min-w-[60px]' : 'min-w-[35px]',
                    co(state),
                    'hover:opacity-80 active:scale-95'
                  )}
                  disabled={st !== 'playing'}
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const ro = (guess: G | null, rowIndex: number, isC = false) => (
    <div className="flex gap-2 mb-2 justify-center">
      {Array(WL).fill(0).map((_, i) => {
        const l = guess ? guess[i] : { char: isC ? c[i] || '' : '', state: 'empty' as S };
        const isFlipping = flippingRow === rowIndex && flippingTiles.has(i);
        const isRevealed = revealedTiles.has(`${rowIndex}-${i}`);
        const isFading = fadingTiles.has(`${rowIndex}-${i}`);
        const showFinalState = guess && isRevealed;
        const shouldShowText = isC || showFinalState;

        return (
          <div
            key={i}
            className={clsx(
              'w-16 h-16 border-2 flex items-center justify-center text-white font-bold text-3xl uppercase transition-all duration-300 rounded-[10%]',
              showFinalState ? co(l.state) : 'border-gray-600 bg-gray-800',
              isFlipping && 'flip'
            )}
          >
            <span className={clsx(
              'transition-all duration-200',
              isFading && 'letter-fade-in'
            )}>
              {shouldShowText ? l.char : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
  const shareResult = useCallback(async () => {
    const gameType = gameMode === 'mathle' ? 'MATHLE' : gameMode === 'geoword' ? 'GEOWORD' : 'WORDLE';

    let shareText = '';
    if (gameMode === 'geoword') {
      const attempts = guessedCountries.length;
      const result = st === 'won' ? '🎉' : '😢';
      shareText = `${gameType} ${attempts}/${MG} ${result}\n\nTarget: ${t}`;
    } else {
      const guesses = g.length;
      const emojiGrid = g.map(row =>
        row.map(cell => {
          switch (cell.state) {
            case 'correct': return '🟩';
            case 'present': return '🟨';
            default: return '⬛';
          }
        }).join('')
      ).join('\n');
      shareText = `${gameType} ${guesses}/${MG}\n\n${emojiGrid}`;
    }

    let copiedToClipboard = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        copiedToClipboard = true;
      } catch (clipboardError) {
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gameType} Result`,
          text: shareText,
        });
        return;
      } catch (error) {
        if (copiedToClipboard) {
          alert('Result copied to clipboard!');
          return;
        }
      }
    }

    if (!copiedToClipboard) {
      alert(`Copy this to share:\n\n${shareText}`);
    } else {
      alert('Result copied to clipboard!');
    }
  }, [g, MG, gameMode, guessedCountries, st, t]);

  const ModeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Select your Wordle</h2>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => selectMode('wordle')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            WORDLE
          </button>
          <button
            onClick={() => selectMode('mathle')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            MATHLE
          </button>
          <button
            onClick={() => selectMode('geoword')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Globe className="w-5 h-5" />
            GEOWORD
          </button>
        </div>
      </div>
    </div>
  );

  const GameModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <h2 className="text-3xl font-bold mb-4 text-white">
          {st === 'won' ? '🎉 Congratulations!' : '😢 Game Over'}
        </h2>
        <p className="text-lg mb-4 text-gray-300">
          {st === 'won'
            ? 'You guessed the word correctly!'
            : `You couldn't guess the word in ${MG} tries.`
          }
        </p>
        <p className="text-xl mb-6 text-white font-mono font-bold">
          The word was: <span className="text-blue-400">{t}</span>
        </p>
        <div className="flex gap-3 justify-center">
          {(st === 'won' || st === 'lost') && (
          <button
            onClick={() => shareResult().catch(error => {
            })}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Share
          </button>
          )}
          <button
            onClick={() => r().catch(error => {
            })}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
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
    if (gameMode === 'geoword') return;

    const h = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      let keyToAdd = k;

      if (gameMode === 'mathle') {
        if (k === '*') keyToAdd = '×';
        else if (k === '/') keyToAdd = '÷';
      }

      const isValidKey = k === 'ENTER' || k === 'BACKSPACE' ||
        (gameMode === 'mathle' ? /^[0-9+\-*/=]$/.test(k) : /^[A-Z]$/.test(k));

      if (isValidKey) {
        e.preventDefault();
        if (k === 'ENTER') sub();
        else if (k === 'BACKSPACE') {
          sC(p => p.length > 0 ? p.slice(0, -1) : p);
        }
        else if (c.length < WL) {
          const currentLength = c.length;
          sC(p => p + keyToAdd);
          const tileKey = `${g.length}-${currentLength}`;
          setFadingTiles(prev => new Set([...prev, tileKey]));
          setTimeout(() => {
            setFadingTiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(tileKey);
              return newSet;
            });
          }, 200);
        }
      } else if (k === 'BACKSPACE') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [c, st, sub, gameMode, WL]);

  if (l && gameMode !== null) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-8">
            {gameMode === 'mathle' ? 'MATHLE' : gameMode === 'geoword' ? 'GEOWORD' : 'WORDLE'}
          </h1>
          <div className="text-xl mb-4">
            Loading {gameMode === 'mathle' ? 'equations' : gameMode === 'geoword' ? 'countries' : 'words'}...
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (e && wL.length === 0 && gameMode !== null) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-8">
            {gameMode === 'mathle' ? 'MATHLE' : gameMode === 'geoword' ? 'GEOWORD' : 'WORDLE'}
          </h1>
          <div className="text-red-400 mb-4">{e}</div>
          <button
            onClick={() => fW()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showModeModal) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
        <ModeModal />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
      <Toast />

      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8">
          {gameMode === 'mathle' ? 'MATHLE' : gameMode === 'geoword' ? 'GEOWORD' : 'WORDLE'}
        </h1>
        {gameMode === 'geoword' ? (
          <div className="mb-8">
            <Globe3D
              targetCountry={t}
              guessedCountries={guessedCountries}
              onCountrySelect={handleCountrySelect}
            />
            <div className="mt-4 text-center">
              <p className="text-gray-300 mb-2">Attempts: {guessedCountries.length}/{MG}</p>
              <p className="text-sm text-gray-400">Click on countries to guess!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              {Array(MG).fill(0).map((_, i) => (
                <div key={i}>
                  {i < g.length ? ro(g[i], i) : i === g.length ? ro(null, i, true) : ro(null, i)}
                </div>
              ))}
            </div>
            <VirtualKeyboard />
          </>
        )}
      </div>

      {showModal && <GameModal />}
    </div>
  );
}
