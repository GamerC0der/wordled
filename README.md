# WORDLED 🎯🔢

A fun dual-mode Wordle game featuring both traditional word guessing and creative mathematical expression challenges!

## 🚀 Features

- **Dual Game Modes**:
  - **WORDLED**: Classic 5-letter word guessing
  - **MATHLED**: Creative 8-character mathematical expression challenges

- **Smart Mode Selection**: 33% chance for Math Wordle, 67% chance for regular Wordle
- **Flexible Math Input**: Create any mathematical expression using numbers and operators
- **Wordle Mechanics**: Color-coded feedback (green, yellow, gray) for position accuracy
- **Responsive Design**: Works great on desktop and mobile devices
- **Dark Theme**: Sleek, modern UI with consistent dark styling

## 🎮 How to Play

### Regular Wordle Mode
- Guess the 5-letter word within 6 attempts
- Green tiles = correct letter in correct position
- Yellow tiles = correct letter in wrong position
- Gray tiles = letter not in the word

### Math Wordle Mode
- Create any mathematical expression that equals the target result
- Use numbers (0-9) and operators (+, -, *, /)
- Must be exactly 8 characters long
- Wordle mechanics apply to each character position

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vercel** - Deployment platform

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/GamerC0der/wordled.git
   cd wordled
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🎯 Game Examples

**Math Mode Examples:**
- Target: `2+3*4=14`
- Valid guesses: `3*4+2=14`, `14-0*0=14`, `4*3+2=14`

**Word Mode Examples:**
- Target: `HOUSE`
- Valid guesses: `HORSE`, `MOUSE`, `ROUSE`

## 📁 Project Structure

```
wordled/
├── public/
│   ├── common-words.txt      # 5-letter word list
│   └── math-expressions.txt  # 8-char math expressions
├── src/
│   └── app/
│       ├── layout.tsx        # App layout
│       └── page.tsx          # Main game component
├── package.json
└── README.md
```

## 🎨 Customization

- **Word Lists**: Edit `public/common-words.txt` and `public/math-expressions.txt`
- **Game Balance**: Modify probabilities and difficulty in `src/app/page.tsx`
- **Styling**: Customize colors and themes using Tailwind classes

## 🚀 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GamerC0der/wordled)

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
