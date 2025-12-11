
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface EventContextType {
  eventId: string | null;
  setEventId: (eventId: string | null) => void;
  isEventLoading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [eventId, setEventIdState] = useState<string | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(true);

  useEffect(() => {
    try {
      const storedEventId = localStorage.getItem('selectedEventId');
      if (storedEventId) {
        setEventIdState(storedEventId);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    } finally {
        setIsEventLoading(false);
    }
  }, []);

  const setEventId = (newEventId: string | null) => {
    setEventIdState(newEventId);
    if (newEventId) {
      localStorage.setItem('selectedEventId', newEventId);
    } else {
      localStorage.removeItem('selectedEventId');
    }
  };

  return (
    <EventContext.Provider value={{ eventId, setEventId, isEventLoading }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
