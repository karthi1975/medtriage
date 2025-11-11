import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Medical Triage System header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Medical Triage System/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders chat interface', () => {
  render(<App />);
  const chatHeader = screen.getByText(/Symptom Assessment Chat/i);
  expect(chatHeader).toBeInTheDocument();
});

test('renders empty results panel initially', () => {
  render(<App />);
  const emptyMessage = screen.getByText(/No Assessment Yet/i);
  expect(emptyMessage).toBeInTheDocument();
});

test('renders disclaimer', () => {
  render(<App />);
  const disclaimer = screen.getByText(/This system is for educational purposes/i);
  expect(disclaimer).toBeInTheDocument();
});
