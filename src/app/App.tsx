import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProgressStore } from '../progress/types';
import { ProgressProvider } from './ProgressContext';
import { href, type Route, useRoute } from './routes';
import { HomeScreen } from './screens/HomeScreen';
import { LessonMapScreen } from './screens/LessonMapScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UpdateBanner } from './UpdateBanner';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PlacementScreen } from './screens/PlacementScreen';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'home': return <HomeScreen />;
    case 'map': return <LessonMapScreen />;
    case 'lesson': return <LessonScreen id={r.id} />;
    case 'exercise': return <ExerciseScreen key={`${r.id}/${r.index}`} id={r.id} index={r.index} />;
    case 'stats': return <StatsScreen />;
    case 'settings': return <SettingsScreen />;
    case 'welcome': return <WelcomeScreen />;
    case 'placement': return <PlacementScreen />;
  }
}

function Shell() {
  const route = useRoute();
  const key = href(route);
  useEffect(() => { window.scrollTo(0, 0); }, [key]);
  return (
    <AnimatePresence mode="wait">
      <motion.main key={key} className="app-main" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        {renderRoute(route)}
      </motion.main>
    </AnimatePresence>
  );
}

export function App({ storeFactory }: { storeFactory?: () => Promise<ProgressStore> }) {
  return (
    <ProgressProvider storeFactory={storeFactory}>
      <Shell />
      <UpdateBanner />
    </ProgressProvider>
  );
}
