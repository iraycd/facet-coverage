/** @jsxImportSource preact */
import { render } from 'preact';
import { App } from './App';

// Mount the app
const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
