import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SettingsProvider } from './contexts/SettingsContext';
import AppContent from './components/AppContent';

function App() {
  return (
    <SettingsProvider>
      <DndProvider backend={HTML5Backend}>
        <AppContent />
      </DndProvider>
    </SettingsProvider>
  );
}

export default React.memo(App);