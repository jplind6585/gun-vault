import { useState, useEffect } from 'react';

export interface UndoAction {
  id: string;
  description: string;
  undo: () => void;
  timestamp: number;
}

export function useUndo() {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [currentAction, setCurrentAction] = useState<UndoAction | null>(null);

  // Keyboard shortcut for undo
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [undoStack]);

  const addUndoAction = (description: string, undoFn: () => void) => {
    const action: UndoAction = {
      id: Date.now().toString(),
      description,
      undo: undoFn,
      timestamp: Date.now()
    };

    setUndoStack(prev => [...prev.slice(-4), action]); // Keep last 5
    setCurrentAction(action);
    setShowUndoToast(true);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowUndoToast(false);
      setCurrentAction(null);
    }, 5000);
  };

  const performUndo = () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    action.undo();
    setUndoStack(prev => prev.slice(0, -1));
    setShowUndoToast(false);
    setCurrentAction(null);
  };

  const clearUndo = () => {
    setUndoStack([]);
    setShowUndoToast(false);
    setCurrentAction(null);
  };

  return {
    addUndoAction,
    performUndo,
    clearUndo,
    canUndo: undoStack.length > 0,
    showUndoToast,
    currentAction
  };
}
