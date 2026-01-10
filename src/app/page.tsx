export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-glass-black text-tennis-green">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed left-0 top-0 flex w-full justify-center border-b border-glass-border bg-gradient-to-b from-zinc-200 p-4 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-tennis-green drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]">
            Pickup NYC
          </h1>
        </div>
      </div>

      <div className="mt-12 glassmorphism p-8 rounded-2xl border border-glass-border">
        <p className="text-xl font-mono text-white/80">
          System Online
        </p>
      </div>
    </main>
  );
}
