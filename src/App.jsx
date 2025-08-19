import React from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import AppContent from './components/AppContent';
import { DndProvider as MultiBackendProvider } from 'react-dnd-multi-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { TouchTransition } from 'react-dnd-multi-backend';

const HTML5toTouch = {
  backends: [
    {
      backend: HTML5Backend,
      transition: undefined,
    },
    {
      backend: TouchBackend,
      options: { enableMouseEvents: true },
      preview: true,
      transition: TouchTransition,
    },
  ],
};

function App() {
  return (
    <SettingsProvider>
      <MultiBackendProvider options={HTML5toTouch}>
        <AppContent />
      </MultiBackendProvider>
    </SettingsProvider>
  );
}

export default React.memo(App);