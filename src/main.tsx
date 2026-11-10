/**
 * Punto de entrada de la aplicación RTG Unreal Web Viewer.
 */
import { render } from 'preact';
import { App } from './app.js';
import './index.css';

render(<App />, document.getElementById('app')!);
