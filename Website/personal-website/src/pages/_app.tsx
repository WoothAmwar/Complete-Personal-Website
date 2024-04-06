import React from 'react';
import { AppProps } from 'next/app';
import NavigationBar from '@/components/NavigationBar';

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <div>
      <header>
        <NavigationBar />
      </header>
      <main>
        <Component {...pageProps} />
      </main>
      <footer>
        <p>Copyright &copy; 2024 Anwar Kader (Not real Copyright)</p>
      </footer>
    </div>
  );
}

export default App;
