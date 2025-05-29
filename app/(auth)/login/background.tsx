export function LoginBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-800/50 to-blue-700/30" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/login-background.png")' }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 1200 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0,400 C 200,500 400,300 600,400 C 800,500 1000,300 1200,400 L 1200,800 L 0,800 Z"
          fill="rgba(30, 58, 138, 0.2)"
        />
        <path
          d="M 0,500 C 200,600 400,400 600,500 C 800,600 1000,400 1200,500 L 1200,800 L 0,800 Z"
          fill="rgba(30, 58, 138, 0.3)"
        />
        <path
          d="M 0,600 C 200,700 400,500 600,600 C 800,700 1000,500 1200,600 L 1200,800 L 0,800 Z"
          fill="rgba(30, 58, 138, 0.4)"
        />
      </svg>
    </div>
  )
}
